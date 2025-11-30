import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

let db: admin.firestore.Firestore;

// Initialize Firebase Admin
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // Read service account file
    const serviceAccountPath = path.join(process.cwd(), "permissions.json");
    
    // Check if file exists
    if (!fs.existsSync(serviceAccountPath)) {
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

    console.log("Firebase Admin initialized successfully");
    return admin.app();
  } catch (error: any) {
    console.error("Error initializing Firebase Admin:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    throw new Error(`Failed to initialize Firebase Admin: ${error?.message || "Unknown error"}`);
  }
}

// Initialize and get Firestore instance
try {
  const app = initializeFirebase();
  db = app.firestore();
} catch (error: any) {
  console.error("Failed to get Firestore instance:", error);
  throw error;
}

export { db };
export default admin;


