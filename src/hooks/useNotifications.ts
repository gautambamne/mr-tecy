import { useEffect, useRef } from 'react';
import { bookingService } from '@/services/booking.service';
import { Booking, BookingStatus } from '@/types';
import { useToast } from './useToast';

/**
 * Hook for managing in-app notifications for booking status changes
 * Automatically subscribes to user's bookings and shows toasts on status changes
 * 
 * @param customerId - Customer user ID to monitor
 */
export function useNotifications(customerId: string | null) {
    const toast = useToast();
    const bookingStatusRef = useRef<Map<string, BookingStatus>>(new Map());

    useEffect(() => {
        if (!customerId) return;

        // Subscribe to customer's bookings
        const unsubscribe = bookingService.subscribeToCustomerBookings(
            customerId,
            (bookings) => {
                bookings.forEach((booking) => {
                    const previousStatus = bookingStatusRef.current.get(booking.id);

                    // Only show toast if status actually changed
                    if (previousStatus && previousStatus !== booking.status) {
                        showStatusChangeNotification(booking, previousStatus);
                    }

                    // Update our tracking
                    bookingStatusRef.current.set(booking.id, booking.status);
                });
            },
            (error) => {
                console.error('[useNotifications] Error:', error);
                toast.error('Failed to load booking updates');
            }
        );

        return () => {
            unsubscribe();
            bookingStatusRef.current.clear();
        };
    }, [customerId]);

    const showStatusChangeNotification = (booking: Booking, previousStatus: BookingStatus) => {
        const statusMessages: Record<BookingStatus, { title: string; description: string }> = {
            pending: {
                title: 'Booking Pending',
                description: `Your ${booking.serviceName} booking is waiting for partner acceptance`
            },
            accepted: {
                title: '✅ Booking Accepted!',
                description: `${booking.partnerName} has accepted your ${booking.serviceName} booking`
            },
            in_progress: {
                title: '🔧 Service In Progress',
                description: `${booking.partnerName} has started working on your ${booking.serviceName}`
            },
            completed: {
                title: '🎉 Service Completed!',
                description: `Your ${booking.serviceName} booking is complete. Rate your experience!`
            },
            cancelled: {
                title: '❌ Booking Cancelled',
                description: `Your ${booking.serviceName} booking has been cancelled`
            }
        };

        const message = statusMessages[booking.status];

        if (booking.status === 'completed') {
            toast.success(message.title, message.description);
        } else if (booking.status === 'cancelled') {
            toast.warning(message.title, message.description);
        } else {
            toast.info(message.title, message.description);
        }
    };
}

/**
 * Check for upcoming bookings and show reminders
 * Call this on app initialization or page load
 * 
 * @param customerId - Customer user ID
 */
export async function checkBookingReminders(customerId: string) {
    const toast = useToast();

    try {
        const bookings = await bookingService.getCustomerBookings(customerId);
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Check for reminders in localStorage to avoid duplicates
        const reminderKey = `booking_reminders_${customerId}`;
        const shownReminders = JSON.parse(localStorage.getItem(reminderKey) || '[]') as string[];

        bookings.forEach((booking) => {
            if (
                (booking.status === 'accepted' || booking.status === 'pending') &&
                booking.scheduledTime
            ) {
                const scheduledDate = booking.scheduledTime.toDate();

                // If booking is within 24 hours and we haven't shown reminder yet
                if (
                    scheduledDate > now &&
                    scheduledDate < next24Hours &&
                    !shownReminders.includes(booking.id)
                ) {
                    const hoursUntil = Math.floor(
                        (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)
                    );

                    toast.info(
                        '⏰ Upcoming Booking',
                        `Your ${booking.serviceName} booking is in ${hoursUntil} hours`
                    );

                    // Mark as shown
                    shownReminders.push(booking.id);
                    localStorage.setItem(reminderKey, JSON.stringify(shownReminders));
                }
            }
        });
    } catch (error) {
        console.error('[checkBookingReminders] Error:', error);
    }
}

/**
 * Clear old reminder flags from localStorage (cleanup)
 * Call this periodically to prevent localStorage bloat
 */
export function clearOldReminders(customerId: string) {
    const reminderKey = `booking_reminders_${customerId}`;
    const shownReminders = JSON.parse(localStorage.getItem(reminderKey) || '[]') as string[];

    // Keep only reminders from last 7 days
    // In a real app, you'd check booking dates, but this is a simple cleanup
    if (shownReminders.length > 50) {
        // Just keep the last 20
        const recent = shownReminders.slice(-20);
        localStorage.setItem(reminderKey, JSON.stringify(recent));
    }
}
