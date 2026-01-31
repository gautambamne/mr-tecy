"use server";

import { adminStorage } from "@/lib/firebase-admin";

export async function uploadImageAction(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { error: "No file provided" };
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate path
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const path = `services/${filename}`;

        // Get default bucket
        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(path);

        // Upload
        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make the file public (optional - requires "Storage Object Viewer" role or public bucket)
        // Alternatively, use getSignedUrl for temporary access
        // await fileRef.makePublic(); 

        // Construct the public URL (similar to Client SDK's download URL format for public buckets)
        // Note: For this to work, your Storage tokens/rules must allow access, 
        // OR you must make the object public.
        const bucketName = bucket.name;
        const encodedPath = encodeURIComponent(path);
        const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

        return { url: downloadURL };
    } catch (error: any) {
        console.error("Upload error:", error);
        return { error: error.message || "Failed to upload image" };
    }
}
