"use server";

import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { UserRole } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Update user role with security checks and custom claims sync
 * Admin only - enforces business rules:
 * - Only admins can change roles
 * - Users cannot demote themselves
 * - At least one admin must exist
 */
export async function updateUserRoleAction(
    currentUserId: string,
    targetUserId: string,
    newRole: UserRole
) {
    try {
        console.log(`[updateUserRole] Current user: ${currentUserId}, Target: ${targetUserId}, New role: ${newRole}`);

        // 1. Verify current user is admin
        const currentUserDoc = await adminDb.collection("user").doc(currentUserId).get();
        const currentUserData = currentUserDoc.data();

        if (!currentUserData || currentUserData.role !== "admin") {
            return { error: "Unauthorized: Only admins can update roles" };
        }

        // 2. Prevent self-demotion from admin
        if (currentUserId === targetUserId && currentUserData.role === "admin" && newRole !== "admin") {
            return { error: "You cannot demote yourself from admin" };
        }

        // 3. Get target user data
        const targetUserDoc = await adminDb.collection("user").doc(targetUserId).get();
        if (!targetUserDoc.exists) {
            return { error: "User not found" };
        }

        const targetUserData = targetUserDoc.data();
        const oldRole = targetUserData?.role;

        // 4. If demoting from admin, ensure at least one admin remains
        if (oldRole === "admin" && newRole !== "admin") {
            const adminsSnapshot = await adminDb
                .collection("user")
                .where("role", "==", "admin")
                .get();

            if (adminsSnapshot.size <= 1) {
                return { error: "Cannot remove the last admin. Promote another user to admin first." };
            }
        }

        // 5. Update Firestore role
        await adminDb.collection("user").doc(targetUserId).update({
            role: newRole,
            updatedAt: new Date()
        });

        // 6. Sync custom claims
        const customClaims: { [key: string]: boolean } = {
            admin: newRole === "admin",
            partner: newRole === "partner",
            customer: newRole === "customer"
        };

        await adminAuth.setCustomUserClaims(targetUserId, customClaims);

        console.log(`[updateUserRole] Success: ${targetUserId} role changed from ${oldRole} to ${newRole}`);

        // Revalidate relevant pages
        revalidatePath("/admin/users");
        revalidatePath("/admin");

        return {
            success: true,
            message: `User role updated to ${newRole}. User must sign out and sign in again for changes to take full effect.`
        };
    } catch (error: any) {
        console.error("[updateUserRole] Error:", error);
        return { error: error.message || "Failed to update user role" };
    }
}
