import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

let db: admin.firestore.Firestore | null = null;
let initializationAttempted = false;

// Initialize Firebase Admin (lazy initialization)
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Skip initialization during build time
  if (process.env.NEXT_PHASE === "phase-production-build") {
    console.warn("Skipping Firebase Admin initialization during build");
    return null;
  }

  try {
    // Try to use environment variables first (for Vercel/production)
    // All sensitive data MUST come from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (projectId && clientEmail && privateKey) {
      // Validate that all required environment variables are set
      if (!projectId) {
        throw new Error("FIREBASE_PROJECT_ID environment variable is not set");
      }
      
      if (!clientEmail) {
        throw new Error("FIREBASE_CLIENT_EMAIL environment variable is not set");
      }
      
      if (!privateKey) {
        throw new Error("FIREBASE_PRIVATE_KEY environment variable is not set");
      }

      // All sensitive data comes from environment variables - never hardcoded
      const serviceAccount = {
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"), // Replace escaped newlines with actual newlines
      };

      // Use explicit bucket name from env, or construct from project ID
      // Default to new Firebase Storage format: projectId.firebasestorage.app
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

      console.log(`[Firebase Admin] Initializing with project: ${projectId}, bucket: ${storageBucket}`);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: storageBucket,
      });

      console.log("[Firebase Admin] Initialized successfully from environment variables");
      return admin.app();
    } else {
      // Log which environment variables are missing
      const missingVars = [];
      if (!process.env.FIREBASE_PROJECT_ID) missingVars.push("FIREBASE_PROJECT_ID");
      if (!process.env.FIREBASE_CLIENT_EMAIL) missingVars.push("FIREBASE_CLIENT_EMAIL");
      if (!process.env.FIREBASE_PRIVATE_KEY) missingVars.push("FIREBASE_PRIVATE_KEY");
      
      if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
        console.error(`[Firebase Admin] Missing required environment variables in production: ${missingVars.join(", ")}`);
        console.error("[Firebase Admin] Please set these in your deployment platform (Vercel, etc.)");
        throw new Error(`Missing required environment variables: ${missingVars.join(", ")}. Please configure them in your production environment.`);
      }
    }

    // Fallback to permissions.json file (for local development)
    const serviceAccountPath = path.join(process.cwd(), "permissions.json");
    
    // Check if file exists
    if (!fs.existsSync(serviceAccountPath)) {
      // Don't throw during build - just log a warning
      if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
        console.warn(`Service account file not found at: ${serviceAccountPath}. Using environment variables instead.`);
        return null;
      }
      throw new Error(`Service account file not found at: ${serviceAccountPath}`);
    }
    
    const serviceAccountFile = fs.readFileSync(serviceAccountPath, "utf8");
    const serviceAccount = JSON.parse(serviceAccountFile);
    
    // Validate required fields
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      throw new Error("Service account file is missing required fields (private_key, client_email, or project_id)");
    }

    // Ensure private key has proper newlines
    const formattedServiceAccount = {
      ...serviceAccount,
      private_key: (serviceAccount.private_key || "").replace(/\\n/g, "\n"),
    };

    const projectId = serviceAccount.project_id;
    
    if (!projectId) {
      throw new Error("project_id is missing from service account file");
    }

    // Use explicit bucket name from env, or construct from project ID
    // Default to new Firebase Storage format: projectId.firebasestorage.app
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

    console.log(`Initializing Firebase Admin with project: ${projectId}, bucket: ${storageBucket}`);

    admin.initializeApp({
      credential: admin.credential.cert(formattedServiceAccount as admin.ServiceAccount),
      storageBucket: storageBucket,
    });

    console.log("Firebase Admin initialized successfully from permissions.json");
    return admin.app();
  } catch (error: any) {
    console.error("Error initializing Firebase Admin:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    // Don't throw during build - return null instead
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn("Firebase Admin initialization failed during build, will retry at runtime");
      return null;
    }
    throw new Error(`Failed to initialize Firebase Admin: ${error?.message || "Unknown error"}`);
  }
}

// Lazy getter for Firestore instance - only initializes when actually accessed
function getDb(): admin.firestore.Firestore {
  if (db) {
    return db;
  }

  // Mark that we've attempted initialization
  initializationAttempted = true;

  const app = initializeFirebase();
  if (!app) {
    throw new Error("Firebase Admin not initialized. Make sure permissions.json exists or environment variables are set.");
  }

  db = app.firestore();
  return db;
}

// Export db as a Proxy that initializes on first property access
// This allows the same API (db.collection()) while being lazy
const dbProxy = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const firestore = getDb();
    const value = (firestore as any)[prop];
    if (typeof value === 'function') {
      return value.bind(firestore);
    }
    return value;
  }
});

// Helper function to get Storage bucket
export function getStorageBucket() {
  const app = initializeFirebase();
  if (!app) {
    throw new Error("Firebase Admin not initialized. Make sure permissions.json exists or environment variables are set.");
  }
  
  const storage = admin.storage();
  
  // Get bucket name from app options (set during initialization)
  let bucketName = app.options.storageBucket;
  
  if (!bucketName) {
    // Try multiple sources for project ID
    let projectId: string | undefined;
    
    // 1. Try from environment variable
    projectId = process.env.FIREBASE_PROJECT_ID;
    
    // 2. Try from app options
    if (!projectId) {
      projectId = app.options.projectId;
    }
    
    // 3. Try to extract from credential (if it's a cert credential)
    if (!projectId && app.options.credential) {
      const cred = app.options.credential as any;
      if (cred && typeof cred.getAccessToken === 'function') {
        // Try to get project ID from credential
        try {
          // For cert credentials, we can check the internal projectId
          if (cred.projectId) {
            projectId = cred.projectId;
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }
    
    // 4. Try reading from permissions.json as last resort
    if (!projectId) {
      try {
        const serviceAccountPath = path.join(process.cwd(), "permissions.json");
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccountFile = fs.readFileSync(serviceAccountPath, "utf8");
          const serviceAccount = JSON.parse(serviceAccountFile);
          projectId = serviceAccount.project_id;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    if (!projectId) {
      console.error("Debug info:", {
        envProjectId: process.env.FIREBASE_PROJECT_ID,
        appProjectId: app.options.projectId,
        appStorageBucket: app.options.storageBucket,
        hasCredential: !!app.options.credential,
      });
      throw new Error(
        "Cannot determine storage bucket: projectId is undefined. " +
        "Please set FIREBASE_PROJECT_ID environment variable or ensure project_id is in permissions.json. " +
        "Your project ID should be: bayanundur-backend"
      );
    }
    
    // Default to new Firebase Storage format: projectId.firebasestorage.app
    bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    console.warn(`Storage bucket not found in app options, using fallback: ${bucketName} (projectId: ${projectId})`);
  }
  
  console.log(`Using storage bucket: ${bucketName}`);
  return storage.bucket(bucketName);
}

export { dbProxy as db };
export default admin;


