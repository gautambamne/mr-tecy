"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cloudinaryUploadService } from "@/services/cloudinary-upload.service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    ChevronLeft,
    Loader2,
    X,
    ImageIcon,
    FileText,
    Zap,
    Clock,
    Calendar as CalendarIcon,
    MapPin,
    Check,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const TIME_SLOTS = [
    { label: "9:00 AM - 11:00 AM", value: "09:00" },
    { label: "11:00 AM - 1:00 PM", value: "11:00" },
    { label: "2:00 PM - 4:00 PM", value: "14:00" },
    { label: "4:00 PM - 6:00 PM", value: "16:00" },
    { label: "6:00 PM - 8:00 PM", value: "18:00" },
];

export default function BookingSchedulePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [bookingData, setBookingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [bookingType, setBookingType] = useState<"instant" | "scheduled">("instant");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        // Load booking data from session storage
        const data = sessionStorage.getItem("myBookingData");
        if (!data) {
            router.push("/booking");
            return;
        }

        setBookingData(JSON.parse(data));
        setLoading(false);
    }, [user, authLoading]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const file = files[0];
            const result = await cloudinaryUploadService.uploadImage(file);
            setUploadedImages([...uploadedImages, result.url]);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        // Validation
        if (!description.trim()) {
            alert("Please describe the problem you're facing");
            return;
        }

        if (bookingType === "scheduled" && (!selectedDate || !selectedTimeSlot)) {
            alert("Please select a date and time for your scheduled booking");
            return;
        }

        // Calculate scheduled time
        let scheduledDateTime: Date;
        if (bookingType === "instant") {
            scheduledDateTime = new Date();
        } else {
            const [hours, minutes] = selectedTimeSlot.split(":");
            scheduledDateTime = new Date(selectedDate!);
            scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
        }

        // Update booking data
        const updatedBookingData = {
            ...bookingData,
            bookingType,
            scheduledTime: scheduledDateTime.toISOString(),
            description,
            notes,
            images: uploadedImages,
        };

        sessionStorage.setItem("myBookingData", JSON.stringify(updatedBookingData));

        // Navigate to partner selection (Reverse Flow: Schedule -> Partner)
        router.push("/booking/partner-selection");
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || !bookingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-32">
            {/* Premium Background */}
            <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-blue-100/40 via-cyan-50/30 to-transparent pointer-events-none" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-0 z-30 flex items-center gap-3 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-slate-100 rounded-xl">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    Schedule & Details
                </h1>
            </div>

            <main className="relative z-10 max-w-md mx-auto p-4 sm:p-6 space-y-6 pt-6">
                {/* Location Display (Read-only) */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Service Location
                    </p>
                    <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">{bookingData.address.label}</p>
                                    <p className="text-xs text-slate-600 mt-0.5">{bookingData.address.street}</p>
                                    <p className="text-xs text-blue-600 font-mono mt-1">
                                        {bookingData.location.lat.toFixed(4)}, {bookingData.location.lng.toFixed(4)}
                                    </p>
                                </div>
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Booking Type Selection */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Booking Type *
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setBookingType("instant")}
                            className={cn(
                                "p-4 rounded-2xl border-2 transition-all duration-200",
                                bookingType === "instant"
                                    ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
                                    : "border-slate-200 bg-white hover:border-blue-300"
                            )}
                        >
                            <Zap className={cn("w-6 h-6 mx-auto mb-2", bookingType === "instant" ? "text-blue-600" : "text-slate-400")} />
                            <p className={cn("text-sm font-bold text-center", bookingType === "instant" ? "text-blue-900" : "text-slate-700")}>
                                Instant
                            </p>
                            <p className="text-xs text-slate-500 text-center mt-1">ASAP (30 min)</p>
                        </button>
                        <button
                            onClick={() => setBookingType("scheduled")}
                            className={cn(
                                "p-4 rounded-2xl border-2 transition-all duration-200",
                                bookingType === "scheduled"
                                    ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
                                    : "border-slate-200 bg-white hover:border-blue-300"
                            )}
                        >
                            <Clock className={cn("w-6 h-6 mx-auto mb-2", bookingType === "scheduled" ? "text-blue-600" : "text-slate-400")} />
                            <p className={cn("text-sm font-bold text-center", bookingType === "scheduled" ? "text-blue-900" : "text-slate-700")}>
                                Scheduled
                            </p>
                            <p className="text-xs text-slate-500 text-center mt-1">Pick date & time</p>
                        </button>
                    </div>
                </div>

                {/* Scheduled Booking Details */}
                {bookingType === "scheduled" && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        {/* Date Selection */}
                        <div className="space-y-2.5">
                            <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                                Select Date *
                            </p>
                            <input
                                type="date"
                                value={selectedDate && !isNaN(selectedDate.getTime()) ? format(selectedDate, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                    const dateValue = e.target.value;
                                    if (!dateValue) {
                                        setSelectedDate(undefined);
                                        return;
                                    }
                                    const newDate = new Date(dateValue);
                                    if (!isNaN(newDate.getTime())) {
                                        setSelectedDate(newDate);
                                    }
                                }}
                                min={format(new Date(), "yyyy-MM-dd")}
                                className="w-full p-4 border-2 border-slate-200 rounded-2xl font-semibold text-slate-900 focus:border-blue-600 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Time Slot Selection */}
                        <div className="space-y-2.5">
                            <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                                Select Time Slot *
                            </p>
                            <div className="space-y-2">
                                {TIME_SLOTS.map((slot) => (
                                    <button
                                        key={slot.value}
                                        onClick={() => setSelectedTimeSlot(slot.value)}
                                        className={cn(
                                            "w-full p-3 rounded-xl border-2 text-left transition-all duration-200",
                                            selectedTimeSlot === slot.value
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-slate-200 bg-white hover:border-blue-300"
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                "text-sm font-bold",
                                                selectedTimeSlot === slot.value ? "text-blue-900" : "text-slate-700"
                                            )}
                                        >
                                            {slot.label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Problem Description */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Problem Description *
                    </p>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue or service requirement..."
                        className="min-h-[120px] border-2 border-slate-200 rounded-2xl p-4 focus:border-blue-600 resize-none"
                    />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Additional Notes (Optional)
                    </p>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special instructions or preferences..."
                        className="min-h-[80px] border-2 border-slate-200 rounded-2xl p-4 focus:border-blue-600 resize-none"
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Upload Photos (Optional)
                    </p>
                    <div className="space-y-3">
                        {uploadedImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {uploadedImages.map((image, index) => (
                                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200">
                                        <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <label className="block">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all",
                                    uploading
                                        ? "border-blue-300 bg-blue-50"
                                        : "border-slate-300 hover:border-blue-600 hover:bg-blue-50"
                                )}
                            >
                                <div className="text-center">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    )}
                                    <p className="text-sm font-bold text-slate-700">
                                        {uploading ? "Uploading..." : "Click to upload photo"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">JPG, PNG or WEBP (Max 10MB)</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] z-50">
                <div className="max-w-md mx-auto">
                    <Button
                        onClick={handleNext}
                        disabled={submitting || !description.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 sm:h-14 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Find Available Partners"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
