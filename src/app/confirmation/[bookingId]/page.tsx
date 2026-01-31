"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/booking.service";
import { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, MapPin, Calendar, Clock, User, Wrench, Home, History } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function ConfirmationPage() {
    const { bookingId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId, user]);

    const fetchBooking = async () => {
        try {
            // For now, we'll just use the booking data from bookingService
            // In a production app, you'd have a getBookingById method
            const bookings = await bookingService.getCustomerBookings(user!.uid);
            const currentBooking = bookings.find(b => b.id === bookingId);

            if (currentBooking) {
                setBooking(currentBooking);
            }
        } catch (error) {
            console.error("Error fetching booking:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <p className="text-slate-600 font-medium mb-4">Booking not found</p>
                <Link href="/">
                    <Button>Go Home</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 pb-32">
            <main className="max-w-md mx-auto p-4 pt-16 space-y-6">
                {/* Success Icon */}
                <div className="flex flex-col items-center text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                        Booking Confirmed!
                    </h1>
                    <p className="text-slate-600">
                        Your service request has been submitted successfully
                    </p>
                </div>

                {/* Booking ID */}
                <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                            Booking ID
                        </p>
                        <p className="font-mono text-lg font-extrabold text-blue-900">
                            #{booking.id.substring(0, 8).toUpperCase()}
                        </p>
                    </CardContent>
                </Card>

                {/* Booking Details */}
                <Card className="shadow-md border-none">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-extrabold text-lg text-slate-900 mb-4">Booking Details</h3>

                        <div className="space-y-3">
                            {/* Service */}
                            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Wrench className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Service</p>
                                    <p className="font-bold text-slate-900">{booking.serviceName}</p>
                                </div>
                            </div>

                            {/* Partner */}
                            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Partner</p>
                                    <p className="font-bold text-slate-900">{booking.partnerName}</p>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Scheduled For</p>
                                    <p className="font-bold text-slate-900">
                                        {booking.scheduledTime && format(booking.scheduledTime.toDate(), "EEEE, MMMM dd")}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {booking.scheduledTime && format(booking.scheduledTime.toDate(), "h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Service Location</p>
                                    <p className="font-medium text-slate-900">{booking.location.label}</p>
                                    <p className="text-sm text-slate-600">
                                        {booking.location.street}, {booking.location.city}
                                    </p>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="font-bold text-slate-700">Payment Method:</span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 font-extrabold text-sm rounded-full">
                                    COD
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Info */}
                <Card className="border-2 border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                        <div className="flex gap-3">
                            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-900 mb-1">Waiting for Partner Confirmation</p>
                                <p className="text-sm text-amber-700">
                                    Your partner will confirm the booking soon. You'll be notified once confirmed.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <Link href="/history" className="flex-1">
                        <Button variant="outline" className="w-full h-12 rounded-xl font-extrabold border-2">
                            <History className="w-4 h-4 mr-2" />
                            Track Booking
                        </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                        <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-extrabold">
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
