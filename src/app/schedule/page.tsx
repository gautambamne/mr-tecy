"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/booking.service";
import { uploadService } from "@/services/upload.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Loader2, Clock, MapPin, CreditCard, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const TIME_SLOTS = [
    { label: "9:00 AM - 11:00 AM", value: "09:00" },
    { label: "11:00 AM - 1:00 PM", value: "11:00" },
    { label: "2:00 PM - 4:00 PM", value: "14:00" },
    { label: "4:00 PM - 6:00 PM", value: "16:00" },
    { label: "6:00 PM - 8:00 PM", value: "18:00" },
];

export default function SchedulePage() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        // Retrieve booking data from session storage
        const data = sessionStorage.getItem("bookingData");
        if (!data) {
            router.push("/");
            return;
        }

        setBookingData(JSON.parse(data));
    }, [user]);

    const handleConfirmBooking = async () => {
        if (!selectedDate || !selectedTimeSlot) {
            alert("Please select a date and time slot");
            return;
        }

        if (!bookingData || !user || !profile) {
            alert("Missing booking information");
            return;
        }

        setLoading(true);

        try {
            // Create scheduled datetime
            const [hours, minutes] = selectedTimeSlot.split(":");
            const scheduledDateTime = new Date(selectedDate);
            scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

            // Create booking in Firestore
            const booking = await bookingService.createBooking({
                customerId: user.uid,
                customerName: profile.displayName,
                partnerId: bookingData.partnerId,
                partnerName: bookingData.partnerName,
                serviceId: bookingData.serviceId,
                serviceName: "Service", // Will be populated by the service name from earlier
                servicePrice: 0, // Will be calculated
                type: "scheduled",
                scheduledTime: scheduledDateTime as any,
                location: bookingData.location,
                description: bookingData.description,
                notes: bookingData.notes || "",
                images: [], // Will upload images next
                paymentMethod: "COD",
                totalAmount: 0, // Will be calculated
            });

            // Upload images if any (stored in session)
            // const imageCount = JSON.parse(sessionStorage.getItem("bookingImages") || "0");
            // If images were selected, upload them here
            // For now, we'll skip this as it requires passing File objects through session

            // Clear session data
            sessionStorage.removeItem("bookingData");
            sessionStorage.removeItem("bookingImages");

            // Navigate to confirmation page
            router.push(`/confirmation/${booking.id}`);
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Failed to create booking. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!bookingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <div className="bg-white border-b px-4 py-4 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-extrabold text-slate-900">Schedule Booking</h1>
                </div>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-6 pt-6">
                {/* Booking Summary */}
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <CardContent className="p-5">
                        <h3 className="font-extrabold text-lg mb-3">Booking Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold">Location</p>
                                    <p className="text-blue-100 opacity-90">
                                        {bookingData.location.street}, {bookingData.location.city}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold w-24">Partner:</span>
                                <span className="text-blue-100">{bookingData.partnerName}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Date Selection */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                        Select Date
                    </label>
                    <div className="bg-white rounded-2xl p-4 border-2 border-slate-200">
                        <input
                            type="date"
                            value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                            onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                            min={format(new Date(), "yyyy-MM-dd")}
                            className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:outline-none font-medium text-slate-900"
                        />
                    </div>
                    {selectedDate && (
                        <p className="text-sm text-blue-600 font-bold ml-1">
                            Selected: {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                        </p>
                    )}
                </div>

                {/* Time Slot Selection */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Select Time Slot
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                        {TIME_SLOTS.map((slot) => (
                            <button
                                key={slot.value}
                                onClick={() => setSelectedTimeSlot(slot.value)}
                                className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${selectedTimeSlot === slot.value
                                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100"
                                    : "border-slate-200 bg-white hover:border-blue-300"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{slot.label}</span>
                                    {selectedTimeSlot === slot.value && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Method */}
                <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-800 uppercase tracking-wider">
                                    Payment Method
                                </p>
                                <p className="font-extrabold text-green-900">Cash on Delivery (COD)</p>
                                <p className="text-xs text-green-700">Pay after service completion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto">
                    <Button
                        onClick={handleConfirmBooking}
                        disabled={!selectedDate || !selectedTimeSlot || loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Confirm Booking →"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
