import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const uploadService = {
    /**
     * Uploads an image to Firebase Storage
     * @param file The file to upload
     * @param folder The folder path (default: 'services')
     * @returns Promise resolving to the download URL
     */
    async uploadImage(file: File, folder: string = "services"): Promise<string> {
        try {
            console.log(`[UploadService] Starting upload: ${file.name} (${file.type}, ${file.size} bytes)`);

            if (!file.type.startsWith("image/")) {
                throw new Error("Invalid file type. Please upload an image.");
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error("File size too large. Max 5MB allowed.");
            }

            // Create a unique filename
            const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
            const path = `${folder}/${filename}`;
            console.log(`[UploadService] Upload path: ${path}`);

            const storageRef = ref(storage, path);

            // Upload with metadata
            const metadata = {
                contentType: file.type,
            };

            const snapshot = await uploadBytes(storageRef, file, metadata);
            console.log("[UploadService] Upload successful. Fetching download URL...");

            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log(`[UploadService] Download URL obtained: ${downloadURL}`);

            return downloadURL;
        } catch (error) {
            console.error("[UploadService] Error uploading image:", error);
            throw error;
        }
    },

    /**
     * Uploads multiple images for a booking to Firebase Storage
     * @param files Array of files to upload
     * @param bookingId The booking ID for folder organization
     * @param onProgress Optional callback for upload progress
     * @returns Promise resolving to array of download URLs
     */
    async uploadBookingImages(
        files: File[],
        bookingId: string,
        onProgress?: (progress: number) => void
    ): Promise<string[]> {
        try {
            console.log(`[UploadService] Starting upload of ${files.length} images for booking ${bookingId}`);

            // Validate all files first
            for (const file of files) {
                if (!file.type.startsWith("image/")) {
                    throw new Error(`Invalid file type: ${file.name}. Please upload images only.`);
                }
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    throw new Error(`File ${file.name} is too large. Max 5MB allowed.`);
                }
            }

            const uploadPromises = files.map(async (file, index) => {
                const timestamp = Date.now();
                const filename = `${timestamp}-${index}-${file.name.replace(/\s+/g, '_')}`;
                const path = `bookings/${bookingId}/images/${filename}`;

                console.log(`[UploadService] Uploading: ${path}`);

                const storageRef = ref(storage, path);
                const metadata = {
                    contentType: file.type,
                };

                const snapshot = await uploadBytes(storageRef, file, metadata);
                const downloadURL = await getDownloadURL(snapshot.ref);

                console.log(`[UploadService] Uploaded ${index + 1}/${files.length}: ${downloadURL}`);

                // Report progress if callback provided
                if (onProgress) {
                    const progress = ((index + 1) / files.length) * 100;
                    onProgress(progress);
                }

                return downloadURL;
            });

            const urls = await Promise.all(uploadPromises);
            console.log(`[UploadService] Successfully uploaded ${urls.length} images`);

            return urls;
        } catch (error) {
            console.error("[UploadService] Error uploading booking images:", error);
            throw error;
        }
    }
};
