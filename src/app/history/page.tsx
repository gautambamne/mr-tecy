"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCustomerBookings } from "@/hooks/useBooking";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/useToast";
import { bookingService } from "@/services/booking.service";
import { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingTimeline } from "@/components/BookingTimeline";
import { Loader2, Clock, MapPin, XCircle, Star, ChevronRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { BottomNavigation } from "@/components/BottomNavigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const { bookings, loading, error, isRetrying, retryCount, isIndexBuilding } = useCustomerBookings(user?.uid || null);
    const router = useRouter();
    const toast = useToast();

    // Enable real-time notifications
    useNotifications(user?.uid || null);

    const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            setCancelingBookingId(bookingId);
            await bookingService.cancelBooking(bookingId, "Cancelled by customer");
            toast.success("Booking cancelled", "Your booking has been cancelled successfully");
        } catch (error: any) {
            console.error("[HistoryPage] Error cancelling booking:", error);
            toast.error("Cancellation failed", error.message || "Failed to cancel booking");
        } finally {
            setCancelingBookingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'accepted':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'in_progress':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    // Show friendly loading state during retry
    if (authLoading || (loading && !isRetrying)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Loading bookings...</p>
                </div>
            </div>
        );
    }

    // Friendly UI for index-building with retry status
    if (isIndexBuilding && (error || isRetrying)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Clock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Bookings are Syncing</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        We're setting up your booking history. This usually takes just a moment.
                    </p>

                    {isRetrying && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                <span className="text-sm font-semibold text-blue-800">
                                    Auto-retry in progress (Attempt {retryCount}/5)
                                </span>
                            </div>
                            <p className="text-xs text-blue-700">Please wait while we reconnect...</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-full px-6"
                        >
                            Refresh Now
                        </Button>
                        <p className="text-xs text-slate-500">
                            Or wait for automatic retry
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Generic error (non-index-building)
    if (error && !isIndexBuilding) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Bookings</h3>
                    <p className="text-sm text-slate-600 mb-6">{error.message || "Something went wrong"}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 font-bold rounded-full px-6"
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 bg-slate-50">
            {/* Header */}
            <header className="px-6 pt-8 pb-6 bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Booking History
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Track your service requests in real-time
                    </p>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 space-y-4 pt-6">
                {bookings.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-10 h-10 text-blue-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No bookings yet</h3>
                        <p className="text-slate-500 text-sm mb-6">Book your first service to get started</p>
                        <Link href="/">
                            <Button className="bg-blue-600 hover:bg-blue-700 font-bold rounded-full px-8">
                                Browse Services →
                            </Button>
                        </Link>
                    </div>
                ) : (
                    bookings.map((booking) => (
                        <Card
                            key={booking.id}
                            className="border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden rounded-2xl bg-white"
                        >
                            <CardHeader className="pb-4 pt-5 px-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-lg font-bold text-slate-900">
                                            {booking.serviceName}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                #{booking.id.slice(-6)}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                {format(booking.createdAt.toDate(), "MMM dd, yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        className={`font-bold text-xs px-3 py-1 border ${getStatusColor(
                                            booking.status
                                        )}`}
                                    >
                                        {booking.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {/* Booking Timeline */}
                                <BookingTimeline status={booking.status} createdAt={booking.createdAt.toDate()} />
                            </CardHeader>

                            <CardContent className="px-5 pb-5 space-y-4">
                                {/* Booking Details */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium">{booking.location.street}, {booking.location.city}</span>
                                    </div>
                                    {booking.scheduledTime && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">
                                                {format(booking.scheduledTime.toDate(), "EEE, MMM dd 'at' h:mm a")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Partner Info */}
                                {booking.partnerName && (
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Partner</p>
                                        <p className="text-sm font-bold text-slate-900">{booking.partnerName}</p>
                                    </div>
                                )}

                                {/* Total Amount */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                                        <p className="text-xl font-extrabold text-blue-600">₹{booking.totalAmount || booking.servicePrice}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {(booking.status === 'pending' || booking.status === 'accepted') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCancelBooking(booking.id)}
                                                disabled={cancelingBookingId === booking.id}
                                                className="text-red-600 border-red-200 hover:bg-red-50 font-bold rounded-full"
                                            >
                                                {cancelingBookingId === booking.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Cancel
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {booking.status === 'completed' && (
                                            <Link href={`/review/${booking.id}`}>
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 font-bold rounded-full"
                                                >
                                                    <Star className="w-4 h-4 mr-1" />
                                                    Leave Review
                                                </Button>
                                            </Link>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                            onClick={() => router.push(`/confirmation/${booking.id}`)}
                                        >
                                            Details
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </main>

            <BottomNavigation />
        </div>
    );
}
