import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    serverTimestamp,
    orderBy,
    onSnapshot,
    Unsubscribe,
    limit,
    startAfter,
    DocumentSnapshot,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking, BookingStatus } from "@/types";
import { checkTimeOverlap, calculateBookingEndTime, getDayBoundaries } from "@/utils/time-overlap.util";

export const bookingService = {
    // Create New Booking (Customer)
    async createBooking(bookingData: Omit<Booking, 'id' | 'status' | 'paymentStatus' | 'createdAt'>) {
        try {
            const bookingsRef = collection(db, "bookings");
            const newBooking = {
                ...bookingData,
                status: 'pending' as BookingStatus,
                paymentStatus: 'pending' as const, // COD is pending until paid
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(bookingsRef, newBooking);

            // Notify Partner
            try {
                // Import dynamically to avoid circular dependencies if any
                const { notificationService } = await import("@/services/notification.service");
                await notificationService.createNotification({
                    userId: bookingData.partnerId,
                    title: "New Booking Request",
                    message: `You have a new booking request from ${bookingData.customerName} for ${bookingData.serviceName}`,
                    type: "info",
                    link: "/partner/dashboard"
                });
            } catch (err) {
                console.error("Failed to send notification to partner:", err);
            }

            return { id: docRef.id, ...newBooking };
        } catch (error) {
            console.error("Error creating booking:", error);
            throw error;
        }
    },

    // Get Customer Bookings
    async getCustomerBookings(customerId: string) {
        try {
            console.log("Fetching bookings for customer:", customerId);
            const bookingsRef = collection(db, "bookings");
            const q = query(
                bookingsRef,
                where("customerId", "==", customerId)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

            // Sort in-memory to avoid indexing issues during development
            return data.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error getting customer bookings:", error);
            throw error;
        }
    },

    // Get All Bookings (Admin)
    async getAllBookings() {
        try {
            const bookingsRef = collection(db, "bookings");
            const snapshot = await getDocs(bookingsRef);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));

            // Sort in-memory
            return data.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error getting all bookings:", error);
            throw error;
        }
    },

    // Real-time subscription to all bookings (Admin)
    subscribeToAllBookings(
        onUpdate: (bookings: Booking[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        const bookingsRef = collection(db, "bookings");

        return onSnapshot(
            bookingsRef,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Booking));

                // Sort in-memory by creation date
                const sorted = data.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeB - timeA;
                });

                onUpdate(sorted);
            },
            (error) => {
                console.error("Error in bookings subscription:", error);
                if (onError) onError(error);
            }
        );
    },


    // Real-time booking statistics (Admin)
    subscribeToBookingStats(
        onUpdate: (stats: {
            total: number;
            pending: number;
            accepted: number;
            inProgress: number;
            completed: number;
            cancelled: number;
            totalRevenue: number;
            pendingRevenue: number;
        }) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        const bookingsRef = collection(db, "bookings");

        return onSnapshot(
            bookingsRef,
            (snapshot) => {
                const bookings = snapshot.docs.map(doc => doc.data() as Booking);

                const stats = {
                    total: bookings.length,
                    pending: bookings.filter(b => b.status === 'pending').length,
                    accepted: bookings.filter(b => b.status === 'accepted').length,
                    inProgress: bookings.filter(b => b.status === 'in_progress').length,
                    completed: bookings.filter(b => b.status === 'completed').length,
                    cancelled: bookings.filter(b => b.status === 'cancelled').length,
                    totalRevenue: bookings
                        .filter(b => b.paymentStatus === 'paid')
                        .reduce((sum, b) => sum + b.servicePrice, 0),
                    pendingRevenue: bookings
                        .filter(b => b.paymentStatus === 'pending')
                        .reduce((sum, b) => sum + b.servicePrice, 0),
                };

                onUpdate(stats);
            },
            (error) => {
                console.error("Error in booking stats subscription:", error);
                if (onError) onError(error);
            }
        );
    },

    // Update Booking Status (Partner/Admin)
    async updateBookingStatus(bookingId: string, newStatus: BookingStatus) {
        try {
            const bookingRef = doc(db, "bookings", bookingId);

            // Fetch current booking to validate transition
            const bookingSnap = await getDoc(bookingRef);
            if (!bookingSnap.exists()) {
                throw new Error("Booking not found");
            }

            const currentBooking = bookingSnap.data() as Booking;
            const currentStatus = currentBooking.status;

            // Import validation function
            const { isValidStatusTransition, getTransitionErrorMessage } = await import("@/lib/booking-status");

            // Validate the transition
            if (!isValidStatusTransition(currentStatus, newStatus)) {
                const errorMsg = getTransitionErrorMessage(currentStatus, newStatus);
                throw new Error(errorMsg);
            }

            const updates: any = { status: newStatus };

            if (newStatus === 'completed') {
                // Set warranty + 30 days
                const warrantyDate = new Date();
                warrantyDate.setDate(warrantyDate.getDate() + 30);
                updates.warrantyValidUntil = warrantyDate; // Firestore will convert Date to Timestamp
                updates.paymentStatus = 'paid'; // Assume COD collected on completion
            }

            await updateDoc(bookingRef, updates);

            // Notify Customer about status update
            try {
                const { notificationService } = await import("@/services/notification.service");
                let message = `Your booking for ${currentBooking.serviceName} is now ${newStatus}.`;
                let title = "Booking Update";

                if (newStatus === 'accepted') {
                    title = "Booking Accepted";
                    message = `${currentBooking.partnerName} accepted your booking for ${currentBooking.serviceName}.`;
                } else if (newStatus === 'in_progress') {
                    title = "Service Started";
                    message = `${currentBooking.partnerName} has started working on your service.`;
                } else if (newStatus === 'completed') {
                    title = "Service Completed";
                    message = `Your service for ${currentBooking.serviceName} is completed. Please rate your experience!`;
                } else if (newStatus === 'cancelled') {
                    title = "Booking Cancelled";
                    message = `Your booking for ${currentBooking.serviceName} has been cancelled.`;
                }

                await notificationService.createNotification({
                    userId: currentBooking.customerId,
                    title: title,
                    message: message,
                    type: "booking_update",
                    link: "/history"
                });
            } catch (err) {
                console.error("Failed to send notification to customer:", err);
            }

        } catch (error) {
            console.error("Error updating booking status:", error);
            throw error;
        }
    },

    /**
     * Real-time subscription to a single booking
     * @param bookingId - ID of the booking to subscribe to
     * @param onUpdate - Callback fired when booking data changes
     * @param onError - Optional error handler
     * @returns Unsubscribe function
     */
    subscribeToBooking(
        bookingId: string,
        onUpdate: (booking: Booking | null) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        const bookingRef = doc(db, "bookings", bookingId);

        return onSnapshot(
            bookingRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const booking = { id: snapshot.id, ...snapshot.data() } as Booking;
                    onUpdate(booking);
                } else {
                    onUpdate(null);
                }
            },
            (error) => {
                console.error("[BookingService] Error in booking subscription:", error);
                onError?.(error);
            }
        );
    },

    /**
     * Real-time subscription to customer's bookings with retry logic
     * @param customerId - Customer user ID
     * @param onUpdate - Callback fired when bookings change
     * @param onError - Optional error handler
     * @returns Unsubscribe function
     */
    subscribeToCustomerBookings(
        customerId: string,
        onUpdate: (bookings: Booking[]) => void,
        onError?: (error: Error & { code?: string; isIndexBuilding?: boolean; retryAfter?: number }) => void
    ): Unsubscribe {
        const q = query(
            collection(db, "bookings"),
            where("customerId", "==", customerId),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const bookings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Booking));
                onUpdate(bookings);
            },
            (error: any) => {
                // Detect index-building errors
                const isIndexBuilding =
                    error.code === 'failed-precondition' ||
                    error.message?.includes('index') ||
                    error.message?.includes('requires an index');

                // Enhanced error object
                const enhancedError = Object.assign(error, {
                    isIndexBuilding,
                    retryAfter: isIndexBuilding ? 10000 : 5000
                });

                // Log details for debugging
                console.error("[BookingService] Customer bookings subscription error:", {
                    code: error.code,
                    message: error.message,
                    isIndexBuilding,
                    timestamp: new Date().toISOString()
                });

                onError?.(enhancedError);
            }
        );
    },

    /**
     * Real-time subscription to partner's bookings
     * @param partnerId - Partner user ID
     * @param onUpdate - Callback fired when bookings change
     * @param onError - Optional error handler
     * @returns Unsubscribe function
     */
    subscribeToPartnerBookings(
        partnerId: string,
        onUpdate: (bookings: Booking[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe {
        const q = query(
            collection(db, "bookings"),
            where("partnerId", "==", partnerId),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const bookings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Booking));
                onUpdate(bookings);
            },
            (error) => {
                console.error("[BookingService] Error in partner bookings subscription:", error);
                onError?.(error);
            }
        );
    },

    /**
     * Get customer bookings with pagination
     * @param customerId - Customer user ID
     * @param pageSize - Number of bookings per page
     * @param lastDoc - Last document from previous page (for pagination)
     * @returns Bookings and last document for next page
     */
    async getCustomerBookingsPaginated(
        customerId: string,
        pageSize: number = 10,
        lastDoc?: DocumentSnapshot
    ): Promise<{ bookings: Booking[]; lastDoc: DocumentSnapshot | null }> {
        try {
            let q = query(
                collection(db, "bookings"),
                where("customerId", "==", customerId),
                orderBy("createdAt", "desc"),
                limit(pageSize)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const bookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Booking));

            const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

            return { bookings, lastDoc: lastVisible };
        } catch (error) {
            console.error("[BookingService] Error getting paginated bookings:", error);
            throw error;
        }
    },

    /**
     * Cancel a pending booking
     * @param bookingId - ID of the booking to cancel
     * @param reason - Optional cancellation reason
     */
    async cancelBooking(bookingId: string, reason?: string): Promise<void> {
        try {
            const bookingRef = doc(db, "bookings", bookingId);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) {
                throw new Error("Booking not found");
            }

            const booking = bookingSnap.data() as Booking;

            if (booking.status !== 'pending' && booking.status !== 'accepted') {
                throw new Error("Only pending or accepted bookings can be cancelled");
            }

            await updateDoc(bookingRef, {
                status: 'cancelled' as BookingStatus,
                cancellationReason: reason || 'Cancelled by customer',
                updatedAt: serverTimestamp()
            });

            console.log("[BookingService] Booking cancelled:", bookingId);
        } catch (error) {
            console.error("[BookingService] Error cancelling booking:", error);
            throw error;
        }
    },

    /**
     * Get a single booking by ID
     * @param bookingId - ID of the booking
     * @returns Booking data or null if not found
     */
    async getBookingById(bookingId: string): Promise<Booking | null> {
        try {
            const bookingRef = doc(db, "bookings", bookingId);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) {
                return null;
            }

            return { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
        } catch (error) {
            console.error("[BookingService] Error getting booking:", error);
            throw error;
        }
    },

    /**
     * Get partner bookings for a specific date
     * OPTIMIZED: Query by date range instead of fetching all bookings
     * 
     * @param partnerId - ID of the partner
     * @param date - The date to check bookings for
     * @returns Array of bookings for this partner on this date
     */
    async getPartnerBookingsForDate(partnerId: string, date: Date): Promise<Booking[]> {
        try {
            const bookingsRef = collection(db, "bookings");
            const { startOfDay, endOfDay } = getDayBoundaries(date);

            // Query bookings for this partner on the selected date (filtering in memory to avoid index errors)
            const q = query(
                bookingsRef,
                where("scheduledTime", ">=", Timestamp.fromDate(startOfDay)),
                where("scheduledTime", "<", Timestamp.fromDate(endOfDay))
            );

            const snapshot = await getDocs(q);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Booking))
                .filter(booking =>
                    booking.partnerId === partnerId &&
                    ['pending', 'accepted', 'in_progress'].includes(booking.status)
                );
        } catch (error) {
            console.error("[BookingService] Error fetching partner bookings:", error);
            return [];
        }
    },

    /**
     * Check if a partner is available for a specific time slot
     * REAL-TIME AVAILABILITY CHECK using time overlap detection
     * 
     * @param partnerId - ID of the partner to check
     * @param selectedStart - Start time of the desired booking
     * @param selectedEnd - End time of the desired booking
     * @returns Availability status and overlapping booking if any
     */
    async checkPartnerAvailability(
        partnerId: string,
        selectedStart: Date,
        selectedEnd: Date
    ): Promise<{ available: boolean; overlappingBooking?: Booking }> {
        try {
            // Get all bookings for this partner on the selected date
            const bookings = await this.getPartnerBookingsForDate(partnerId, selectedStart);

            // Check each booking for time overlap
            for (const booking of bookings) {
                const bookingStart = booking.scheduledTime.toDate();
                const bookingEnd = calculateBookingEndTime(bookingStart);

                // Check if times overlap
                if (checkTimeOverlap(selectedStart, selectedEnd, bookingStart, bookingEnd)) {
                    return {
                        available: false,
                        overlappingBooking: booking
                    };
                }
            }

            // No overlaps found - partner is available
            return { available: true };
        } catch (error) {
            console.error("[BookingService] Error checking partner availability:", error);
            // On error, assume unavailable to be safe
            return { available: false };
        }
    },

    /**
     * Get IDs of partners who are already booked for a specific time slot
     * REFACTORED: Now uses time overlap detection instead of exact time matching
     * 
     * @param scheduledTime - The start time of the slot to check
     * @param partners - Array of partner IDs to check (optional, if not provided checks all)
     * @returns Array of partner IDs who have a booking overlapping with this time
     */
    async getBookedPartnerIds(scheduledTime: Date, partners?: string[]): Promise<string[]> {
        try {
            const bookingsRef = collection(db, "bookings");
            const { startOfDay, endOfDay } = getDayBoundaries(scheduledTime);
            const selectedEnd = calculateBookingEndTime(scheduledTime);

            // Query all bookings on the selected date (filtering in memory to avoid index errors)
            const q = query(
                bookingsRef,
                where("scheduledTime", ">=", Timestamp.fromDate(startOfDay)),
                where("scheduledTime", "<", Timestamp.fromDate(endOfDay))
            );

            const snapshot = await getDocs(q);
            const busyPartnerIds = new Set<string>();

            // Check each booking for time overlap
            snapshot.docs.forEach(doc => {
                const booking = doc.data() as Booking;

                // Client-side filtering for active status
                if (!['pending', 'accepted', 'in_progress'].includes(booking.status)) {
                    return;
                }

                const bookingStart = booking.scheduledTime.toDate();
                const bookingEnd = calculateBookingEndTime(bookingStart);

                // Check if this booking overlaps with the selected time slot
                if (checkTimeOverlap(scheduledTime, selectedEnd, bookingStart, bookingEnd)) {
                    // If partners filter is provided, only include partners in the list
                    if (!partners || partners.includes(booking.partnerId)) {
                        busyPartnerIds.add(booking.partnerId);
                    }
                }
            });

            return Array.from(busyPartnerIds);
        } catch (error) {
            console.error("[BookingService] Error checking partner availability:", error);
            return [];
        }
    }
};
