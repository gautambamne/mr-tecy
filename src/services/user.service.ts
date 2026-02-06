import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, Address, UserRole } from "@/types";

export const userService = {
    // Create or Update User Profile
    async saveUserProfile(user: UserProfile) {
        try {
            const userRef = doc(db, "user", user.uid);
            await setDoc(userRef, {
                ...user,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return user;
        } catch (error) {
            console.error("Error saving user profile:", error);
            throw error;
        }
    },

    // Get User Profile by ID
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const userRef = doc(db, "user", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data() as UserProfile;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting user profile:", error);
            throw error;
        }
    },

    // Check if user has a profile, if not create a default one (used in Auth flow)
    async ensureUserProfile(uid: string, email: string, name: string) {
        const profile = await this.getUserProfile(uid);
        if (!profile) {
            // Default new user as Customer
            const newProfile: Partial<UserProfile> = {
                uid,
                email,
                displayName: name,
                role: 'customer',
                addresses: [],
                createdAt: serverTimestamp() as any, // Cast to avoid type issues with client/server timestamps
            };

            const userRef = doc(db, "user", uid);
            await setDoc(userRef, newProfile);
            return newProfile;
        }
        return profile;
    },

    // Add a new address to user profile
    async addAddress(uid: string, address: Omit<Address, 'id'>): Promise<Address> {
        try {
            const newAddress: Address = {
                ...address,
                id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            const userRef = doc(db, "user", uid);
            await updateDoc(userRef, {
                addresses: arrayUnion(newAddress),
                updatedAt: serverTimestamp()
            });

            return newAddress;
        } catch (error) {
            console.error("Error adding address:", error);
            throw error;
        }
    },

    // Update an existing address
    async updateAddress(uid: string, addressId: string, updatedData: Partial<Omit<Address, 'id'>>): Promise<void> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) throw new Error("User profile not found");

            const updatedAddresses = profile.addresses.map(addr =>
                addr.id === addressId ? { ...addr, ...updatedData } : addr
            );

            const userRef = doc(db, "user", uid);
            await updateDoc(userRef, {
                addresses: updatedAddresses,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating address:", error);
            throw error;
        }
    },

    // Delete an address
    async deleteAddress(uid: string, addressId: string): Promise<void> {
        try {
            const profile = await this.getUserProfile(uid);
            if (!profile) throw new Error("User profile not found");

            const addressToRemove = profile.addresses.find(addr => addr.id === addressId);
            if (!addressToRemove) throw new Error("Address not found");

            const userRef = doc(db, "user", uid);
            await updateDoc(userRef, {
                addresses: arrayRemove(addressToRemove),
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error deleting address:", error);
            throw error;
        }
    },

    /**
     * Get all users with a specific role (Admin only)
     */
    async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
        try {
            const usersRef = collection(db, "user");
            const q = query(usersRef, where("role", "==", role));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as UserProfile);
        } catch (error) {
            console.error("Error getting users by role:", error);
            throw error;
        }
    },

    /**
     * Suspend a partner (Admin only)
     */
    async suspendPartner(userId: string): Promise<void> {
        try {
            console.log('[SUSPEND] Starting for userId:', userId);
            const userRef = doc(db, "user", userId);

            const update = {
                status: 'suspended' as const,
                updatedAt: serverTimestamp()
            };
            console.log('[SUSPEND] Update payload:', update);

            await updateDoc(userRef, update);
            console.log('[SUSPEND] Success');
        } catch (error) {
            console.error("[SUSPEND] Error:", error);
            throw error;
        }
    },

    /**
     * Activate a partner (Admin only)
     */
    async activatePartner(userId: string): Promise<void> {
        try {
            console.log('[ACTIVATE] Starting for userId:', userId);
            const userRef = doc(db, "user", userId);

            const update = {
                status: 'active' as const,
                updatedAt: serverTimestamp()
            };
            console.log('[ACTIVATE] Update payload:', update);

            await updateDoc(userRef, update);
            console.log('[ACTIVATE] Success');
        } catch (error) {
            console.error("[ACTIVATE] Error:", error);
            throw error;
        }
    },

    /**
     * Update user role (Admin only)
     * Wrapper around server action for role updates with custom claims sync
     */
    async updateUserRole(currentUserId: string, targetUserId: string, newRole: UserRole): Promise<{ success?: boolean; error?: string; message?: string }> {
        try {
            // Import dynamically to avoid server-only code in client bundle
            const { updateUserRoleAction } = await import("@/actions/user.actions");
            return await updateUserRoleAction(currentUserId, targetUserId, newRole);
        } catch (error) {
            console.error("[updateUserRole] Error:", error);
            throw error;
        }
    }
};
