"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/booking.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ChevronLeft,
    Loader2,
    MapPin,
    Clock,
    CreditCard,
    User,
    FileText,
    Calendar,
    Star
} from "lucide-react";
import { format } from "date-fns";

export default function BookingReviewPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [bookingData, setBookingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        // Try new booking flow first, then fall back to old flow
        const newData = sessionStorage.getItem("myBookingData");
        const oldData = sessionStorage.getItem("bookingReviewData");

        if (newData) {
            setBookingData(JSON.parse(newData));
        } else if (oldData) {
            setBookingData(JSON.parse(oldData));
        } else {
            router.push("/");
            return;
        }

        setLoading(false);
    }, [user]);

    const handleConfirmBooking = async () => {
        if (!bookingData || !user || !profile) {
            alert("Missing booking information");
            return;
        }

        setSubmitting(true);

        try {
            // Check if this is from the new flow (has services array) or old flow
            const isNewFlow = Array.isArray(bookingData.services);

            if (isNewFlow) {
                // New multi-service flow: create separate bookings for each service
                const bookings = [];
                for (const service of bookingData.services) {
                    const finalPrice = Math.round(
                        service.price * service.quantity * (bookingData.priceMultiplier || 1)
                    );

                    const booking = await bookingService.createBooking({
                        customerId: user.uid,
                        customerName: profile.displayName,
                        partnerId: bookingData.partnerId,
                        partnerName: bookingData.partnerName,
                        serviceId: service.id,
                        serviceName: `${service.name} x${service.quantity}`,
                        servicePrice: finalPrice,
                        type: bookingData.bookingType || "instant",
                        scheduledTime: new Date(bookingData.scheduledTime) as any,
                        location: bookingData.address,
                        description: bookingData.description,
                        notes: bookingData.notes || "",
                        images: bookingData.images || [],
                        paymentMethod: "COD",
                        totalAmount: finalPrice,
                    });
                    bookings.push(booking);
                }

                // Clear session data
                sessionStorage.removeItem("myBookingData");

                // Navigate to confirmation page of first booking
                router.push(`/confirmation/${bookings[0].id}`);
            } else {
                // Old single-service flow
                const booking = await bookingService.createBooking({
                    customerId: user.uid,
                    customerName: profile.displayName,
                    partnerId: bookingData.partnerId,
                    partnerName: bookingData.partnerName,
                    serviceId: bookingData.serviceId,
                    serviceName: bookingData.serviceName,
                    servicePrice: bookingData.servicePrice,
                    type: bookingData.type,
                    scheduledTime: new Date(bookingData.scheduledTime) as any,
                    location: bookingData.location,
                    description: bookingData.description,
                    notes: bookingData.notes || "",
                    images: bookingData.images || [],
                    paymentMethod: "COD",
                    totalAmount: bookingData.totalAmount,
                });

                // Clear session data
                sessionStorage.removeItem("bookingReviewData");

                // Navigate to confirmation page
                router.push(`/confirmation/${booking.id}`);
            }
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Failed to create booking. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!bookingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">No booking data found</p>
            </div>
        );
    }

    const scheduledDate = new Date(bookingData.scheduledTime);
    const isInstant = bookingData.type === "instant";

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <div className="bg-white border-b px-4 py-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-md mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-extrabold text-slate-900">Review Booking</h1>
                </div>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-4 pt-6">
                {/* Service Summary */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
                    <CardContent className="p-6 relative">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 rounded-full" />
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-extrabold mb-1">{bookingData.serviceName}</h2>
                                    <p className="text-blue-100 text-sm">Base Price: ₹{bookingData.servicePrice}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-blue-200 mb-1">Total Amount</p>
                                    <p className="text-3xl font-extrabold">₹{bookingData.totalAmount}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-blue-400/30">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-blue-200">Partner</p>
                                        <p className="font-bold">{bookingData.partnerName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Booking Details */}
                <Card className="shadow-sm">
                    <CardContent className="p-5 space-y-4">
                        <h3 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Booking Details</h3>

                        {/* Schedule */}
                        <div className="flex items-start gap-3">
                            {isInstant ? (
                                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            ) : (
                                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">
                                    {isInstant ? "Instant Booking" : "Scheduled"}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {isInstant
                                        ? "Partner will arrive ASAP (usually within 30 minutes)"
                                        : format(scheduledDate, "EEEE, MMMM dd, yyyy 'at' hh:mm a")}
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900">
                                    {(bookingData.address || bookingData.location)?.label || "Selected Location"}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {(bookingData.address || bookingData.location)?.street ||
                                        (bookingData.location?.lat ? `${bookingData.location.lat.toFixed(4)}, ${bookingData.location.lng.toFixed(4)}` : "-")},
                                    {(bookingData.address || bookingData.location)?.city || "Unknown City"}
                                    {(bookingData.address || bookingData.location)?.zipCode ? ` - ${(bookingData.address || bookingData.location)?.zipCode}` : ""}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 mb-1">Problem Description</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{bookingData.description}</p>
                            </div>
                        </div>

                        {/* Notes (if any) */}
                        {bookingData.notes && (
                            <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                                <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 mb-1">Special Instructions</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">{bookingData.notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Images (if any) */}
                        {bookingData.images && bookingData.images.length > 0 && (
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-sm font-bold text-slate-900 mb-3">Uploaded Photos ({bookingData.images.length})</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {bookingData.images.map((img: string, idx: number) => (
                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                                            <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="border-2 border-green-200 bg-green-50 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1">
                                    Payment Method
                                </p>
                                <p className="font-extrabold text-green-900">Cash on Delivery (COD)</p>
                                <p className="text-xs text-green-700 mt-0.5">Pay ₹{bookingData.totalAmount} after service completion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Important Info */}
                <Card className="bg-blue-50 border-2 border-blue-100 shadow-sm">
                    <CardContent className="p-5">
                        <h4 className="font-bold text-blue-900 mb-2">📋 Important Information</h4>
                        <ul className="space-y-1.5 text-sm text-blue-800">
                            <li>• Your booking will be confirmed immediately</li>
                            <li>• The partner will contact you shortly</li>
                            <li>• All services come with a 30-day warranty</li>
                            <li>• You can track status in your booking history</li>
                        </ul>
                    </CardContent>
                </Card>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto flex gap-3">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl font-extrabold text-base border-2"
                        disabled={submitting}
                    >
                        Edit Details
                    </Button>
                    <Button
                        onClick={handleConfirmBooking}
                        disabled={submitting}
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Confirm Booking ✓"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
