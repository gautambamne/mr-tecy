import "server-only";
import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

// Function to get service account
const getServiceAccount = () => {
    try {
        // Try reading from the file we created
        const filePath = path.join(process.cwd(), "firebase-service-account-key.json");
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf8");
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.warn("Could not read local service account file", error);
    }

    // Fallback to env var if file fails or doesn't exist (useful for production envs like Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var");
        }
    }

    return undefined;
};

const serviceAccount = getServiceAccount();

let app: App;

if (!getApps().length) {
    if (!serviceAccount) {
        throw new Error(
            "Firebase Service Account is missing. " +
            "Please ensure firebase-service-account-key.json exists in the root or FIREBASE_SERVICE_ACCOUNT_KEY is set."
        );
    }

    app = initializeApp({
        credential: cert(serviceAccount),
    });
} else {
    app = getApp();
}

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
