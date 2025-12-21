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
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });

      console.log("Firebase Admin initialized successfully from environment variables");
      return admin.app();
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

    admin.initializeApp({
      credential: admin.credential.cert(formattedServiceAccount as admin.ServiceAccount),
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

export { dbProxy as db };
export default admin;


