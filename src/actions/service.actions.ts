"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Service } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Creates a new service in Firestore directly from the server.
 * Bypasses client-side auth rules (requires Admin SDK setup).
 */
export async function createServiceAction(data: any) {
    try {
        console.log("[ServerAction] Creating service with data:", JSON.stringify(data, null, 2));

        // Basic Server-Side Validation
        if (!data.name || !data.price) {
            return { error: "Missing required fields" };
        }

        const newService = {
            ...data,
            active: true,
            createdAt: new Date(), // Admin SDK uses native Date or Timestamp
        };

        const docRef = await adminDb.collection("services").add(newService);
        console.log("[ServerAction] Service created with ID:", docRef.id);

        revalidatePath("/admin/services");
        revalidatePath("/"); // Update homepage

        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("[ServerAction] Error creating service:", error);
        return { error: error.message || "Failed to create service" };
    }
}

/**
 * Updates a service in Firestore
 */
export async function updateServiceAction(id: string, data: any) {
    try {
        console.log(`[ServerAction] Updating service ${id} with data:`, data);

        await adminDb.collection("services").doc(id).update(data);

        revalidatePath("/admin/services");
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("[ServerAction] Error updating service:", error);
        return { error: error.message || "Failed to update service" };
    }
}
