import { useState, useEffect } from 'react';
import { bookingService } from '@/services/booking.service';
import { Booking } from '@/types';

/**
 * Hook for real-time booking subscription
 * Automatically subscribes to booking updates and cleans up on unmount
 * 
 * @param bookingId - ID of the booking to track
 * @returns { booking, loading, error }
 */
export function useBooking(bookingId: string | null) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!bookingId) {
            setBooking(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Subscribe to real-time updates
        const unsubscribe = bookingService.subscribeToBooking(
            bookingId,
            (updatedBooking) => {
                setBooking(updatedBooking);
                setLoading(false);
            },
            (err) => {
                console.error('[useBooking] Subscription error:', err);
                setError(err);
                setLoading(false);
            }
        );

        // Cleanup subscription on unmount or bookingId change
        return () => {
            unsubscribe();
        };
    }, [bookingId]);

    return { booking, loading, error };
}

/**
 * Hook for real-time customer bookings subscription with retry logic
 * 
 * @param customerId - Customer user ID
 * @returns { bookings, loading, error, isRetrying, retryCount, isIndexBuilding }
 */
export function useCustomerBookings(customerId: string | null) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<(Error & { isIndexBuilding?: boolean }) | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isIndexBuilding, setIsIndexBuilding] = useState(false);

    useEffect(() => {
        if (!customerId) {
            setBookings([]);
            setLoading(false);
            return;
        }

        let retryTimeout: NodeJS.Timeout;
        let unsubscribe: (() => void) | null = null;
        let currentRetryCount = 0;
        let isMounted = true;

        const subscribe = () => {
            if (!isMounted) return;

            setLoading(true);
            setError(null);

            // Subscribe to real-time updates
            unsubscribe = bookingService.subscribeToCustomerBookings(
                customerId,
                (updatedBookings) => {
                    if (!isMounted) return;
                    setBookings(updatedBookings);
                    setLoading(false);
                    setIsRetrying(false);
                    setRetryCount(0);
                    setIsIndexBuilding(false);
                    currentRetryCount = 0;
                },
                (err: any) => {
                    if (!isMounted) return;

                    console.error('[useCustomerBookings] Subscription error:', err);

                    const indexBuilding = err.isIndexBuilding || false;
                    setError(err);
                    setLoading(false);
                    setIsIndexBuilding(indexBuilding);

                    // Exponential backoff retry for index-building errors
                    if (indexBuilding && currentRetryCount < 5) {
                        const backoffDelay = Math.min(
                            (err.retryAfter || 10000) * Math.pow(1.5, currentRetryCount),
                            60000 // Max 60 seconds
                        );

                        setIsRetrying(true);
                        setRetryCount(currentRetryCount + 1);

                        console.log(`[useCustomerBookings] Retrying in ${backoffDelay}ms (attempt ${currentRetryCount + 1}/5)`);

                        retryTimeout = setTimeout(() => {
                            if (!isMounted) return;
                            currentRetryCount++;

                            // Unsubscribe previous attempt
                            if (unsubscribe) {
                                unsubscribe();
                            }

                            // Retry subscription
                            subscribe();
                        }, backoffDelay);
                    } else {
                        setIsRetrying(false);
                    }
                }
            );
        };

        // Initial subscription
        subscribe();

        // Cleanup
        return () => {
            isMounted = false;
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [customerId]);

    return { bookings, loading, error, isRetrying, retryCount, isIndexBuilding };
}

/**
 * Hook for paginated booking fetching
 * 
 * @param customerId - Customer user ID
 * @param pageSize - Number of bookings per page (default: 10)
 * @returns { bookings, loading, error, hasMore, loadMore }
 */
export function useBookingPagination(customerId: string | null, pageSize: number = 10) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);

    // Initial load
    useEffect(() => {
        if (!customerId) {
            setBookings([]);
            setLoading(false);
            setHasMore(false);
            return;
        }

        loadInitialBookings();
    }, [customerId]);

    const loadInitialBookings = async () => {
        if (!customerId) return;

        try {
            setLoading(true);
            setError(null);

            const result = await bookingService.getCustomerBookingsPaginated(
                customerId,
                pageSize
            );

            setBookings(result.bookings);
            setLastDoc(result.lastDoc);
            setHasMore(result.bookings.length === pageSize);
        } catch (err) {
            console.error('[useBookingPagination] Error loading initial bookings:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!customerId || !hasMore || loading) return;

        try {
            setLoading(true);

            const result = await bookingService.getCustomerBookingsPaginated(
                customerId,
                pageSize,
                lastDoc
            );

            setBookings(prev => [...prev, ...result.bookings]);
            setLastDoc(result.lastDoc);
            setHasMore(result.bookings.length === pageSize);
        } catch (err) {
            console.error('[useBookingPagination] Error loading more bookings:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    return { bookings, loading, error, hasMore, loadMore };
}
