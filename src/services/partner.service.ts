import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Partner } from "@/types";

export const partnerService = {
    // Create Partner (Admin only)
    async createPartner(partnerData: Omit<Partner, 'id' | 'rating' | 'reviewCount' | 'completedJobs'>) {
        try {
            const partnersRef = collection(db, "partners");
            const newPartner = {
                ...partnerData,
                rating: 0,
                reviewCount: 0,
                completedJobs: 0,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(partnersRef, newPartner);
            return { id: docRef.id, ...newPartner };
        } catch (error) {
            console.error("Error creating partner:", error);
            throw error;
        }
    },

    // Get All Partners (Public - for listing)
    async getPartners() {
        try {
            const partnersRef = collection(db, "partners");
            const snapshot = await getDocs(partnersRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
        } catch (error) {
            console.error("Error getting partners:", error);
            throw error;
        }
    },

    // Get Partners by Service (for filtering)
    async getPartnersByService(serviceId: string) {
        try {
            const partnersRef = collection(db, "partners");
            const q = query(partnersRef, where("services", "array-contains", serviceId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
        } catch (error) {
            console.error("Error getting partners by service:", error);
            throw error;
        }
    },

    // Update Partner (Admin only)
    async updatePartner(partnerId: string, updates: Partial<Partner>) {
        try {
            const partnerRef = doc(db, "partners", partnerId);
            await updateDoc(partnerRef, updates);
        } catch (error) {
            console.error("Error updating partner:", error);
            throw error;
        }
    },

    /**
     * Get available partners for a specific service with filtering and sorting
     * @param serviceId Service ID to filter partners
     * @param filters Optional filters (availability, minRating)
     * @param sortBy Optional sorting: 'rating' | 'price' | 'jobs'
     */
    async getAvailablePartners(
        serviceId: string,
        filters?: {
            onlyOnline?: boolean;
            minRating?: number;
        },
        sortBy: 'rating' | 'price' | 'jobs' = 'rating'
    ) {
        try {
            const partnersRef = collection(db, "partners");
            const q = query(partnersRef, where("services", "array-contains", serviceId));
            const snapshot = await getDocs(q);

            let partners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));

            // Apply filters
            if (filters?.onlyOnline) {
                partners = partners.filter(p => p.availability === 'online');
            }

            if (filters?.minRating !== undefined) {
                partners = partners.filter(p => p.rating >= filters.minRating!);
            }

            // Apply sorting
            partners.sort((a, b) => {
                switch (sortBy) {
                    case 'rating':
                        return b.rating - a.rating; // Highest rating first
                    case 'price':
                        return a.priceMultiplier - b.priceMultiplier; // Lowest price first
                    case 'jobs':
                        return b.completedJobs - a.completedJobs; // Most jobs first
                    default:
                        return 0;
                }
            });

            return partners;
        } catch (error) {
            console.error("Error getting available partners:", error);
            throw error;
        }
    }
};
