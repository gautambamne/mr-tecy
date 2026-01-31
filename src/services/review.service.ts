import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    Unsubscribe,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Review } from "@/types";

export const reviewService = {
    /**
     * Create a new review for a completed booking
     */
    async createReview(reviewData: Omit<Review, 'id' | 'createdAt'>) {
        try {
            // Check if review already exists for this booking
            const existingReview = await this.getReviewByBooking(reviewData.bookingId);
            if (existingReview) {
                throw new Error("A review already exists for this booking");
            }

            const reviewsRef = collection(db, "reviews");
            const newReview = {
                ...reviewData,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(reviewsRef, newReview);
            console.log("[ReviewService] Created review:", docRef.id);

            // Update partner's rating
            await this.updatePartnerRating(reviewData.partnerId);

            return { id: docRef.id, ...newReview };
        } catch (error) {
            console.error("[ReviewService] Error creating review:", error);
            throw error;
        }
    },

    /**
     * Get all reviews for a specific partner
     */
    async getReviewsByPartner(partnerId: string): Promise<Review[]> {
        try {
            const q = query(
                collection(db, "reviews"),
                where("partnerId", "==", partnerId),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        } catch (error) {
            console.error("[ReviewService] Error fetching partner reviews:", error);
            throw error;
        }
    },

    /**
     * Get all reviews by a specific customer
     */
    async getReviewsByCustomer(customerId: string): Promise<Review[]> {
        try {
            const q = query(
                collection(db, "reviews"),
                where("customerId", "==", customerId),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        } catch (error) {
            console.error("[ReviewService] Error fetching customer reviews:", error);
            throw error;
        }
    },

    /**
     * Calculate and update partner's rating based on all their reviews
     */
    async updatePartnerRating(partnerId: string) {
        try {
            const reviews = await this.getReviewsByPartner(partnerId);

            if (reviews.length === 0) {
                console.log("[ReviewService] No reviews found for partner:", partnerId);
                return;
            }

            // Calculate average rating
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal

            // Update partner document
            const partnerRef = doc(db, "partners", partnerId);
            await updateDoc(partnerRef, {
                rating: roundedRating,
                reviewCount: reviews.length
            });

            console.log(`[ReviewService] Updated partner ${partnerId} rating to ${roundedRating} (${reviews.length} reviews)`);
        } catch (error) {
            console.error("[ReviewService] Error updating partner rating:", error);
            throw error;
        }
    },

    /**
     * Subscribe to real-time updates for a partner's reviews
     */
    subscribeToPartnerReviews(
        partnerId: string,
        onUpdate: (reviews: Review[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        const q = query(
            collection(db, "reviews"),
            where("partnerId", "==", partnerId),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const reviews = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Review));
                onUpdate(reviews);
            },
            (error) => {
                console.error("[ReviewService] Error in reviews subscription:", error);
                onError?.(error);
            }
        );
    },

    /**
     * Get review for a specific booking (for checking if already reviewed)
     */
    async getReviewByBooking(bookingId: string): Promise<Review | null> {
        try {
            const q = query(
                collection(db, "reviews"),
                where("bookingId", "==", bookingId),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Review;
        } catch (error) {
            console.error("[ReviewService] Error getting review by booking:", error);
            throw error;
        }
    }
};
