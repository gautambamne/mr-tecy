import "server-only";
import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

let app: App;

if (!getApps().length) {
    app = initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
} else {
    app = getApp();
}

export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
