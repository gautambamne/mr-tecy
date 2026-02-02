"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/services/service.service";
import { partnerService } from "@/services/partner.service";
import { userService } from "@/services/user.service";
import { cloudinaryUploadService } from "@/services/cloudinary-upload.service";
import { Service, Partner, Address } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    ChevronLeft,
    Loader2,
    Clock,
    MapPin,
    Calendar as CalendarIcon,
    X,
    Plus,
    Image as ImageIcon,
    FileText,
    Zap,
    Star,
    ShieldCheck,
    Check,
    Save
} from "lucide-react";
import { format } from "date-fns";

const TIME_SLOTS = [
    { label: "9:00 AM - 11:00 AM", value: "09:00" },
    { label: "11:00 AM - 1:00 PM", value: "11:00" },
    { label: "2:00 PM - 4:00 PM", value: "14:00" },
    { label: "4:00 PM - 6:00 PM", value: "16:00" },
    { label: "6:00 PM - 8:00 PM", value: "18:00" },
];

function SchedulePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile, refreshProfile } = useAuth();

    // URL params
    const serviceId = searchParams.get("serviceId");
    const partnerId = searchParams.get("partnerId");

    // Booking data from API
    const [service, setService] = useState<Service | null>(null);
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [bookingType, setBookingType] = useState<"instant" | "scheduled">("instant");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Address form states
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: "",
        street: "",
        city: "",
        zipCode: ""
    });

    // Load service and partner data
    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (!serviceId || !partnerId) {
            router.push("/");
            return;
        }

        loadData();
    }, [user, serviceId, partnerId]);

    // Set default address when profile loads
    useEffect(() => {
        if (profile?.addresses && profile.addresses.length > 0 && !selectedAddress) {
            setSelectedAddress(profile.addresses[0]);
        }
    }, [profile]);

    const loadData = async () => {
        try {
            const [serviceData, partnerData] = await Promise.all([
                serviceService.getServiceById(serviceId as string),
                partnerService.getPartnersByService(serviceId as string),
            ]);

            setService(serviceData);
            const foundPartner = partnerData.find((p) => p.id === partnerId);
            setPartner(foundPartner || null);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSaveAddress = async () => {
        if (!user) return;

        // Validation
        if (!newAddress.label.trim() || !newAddress.street.trim() ||
            !newAddress.city.trim() || !newAddress.zipCode.trim()) {
            alert("Please fill in all address fields");
            return;
        }

        setSavingAddress(true);
        try {
            const savedAddress = await userService.addAddress(user.uid, newAddress);

            // Refresh profile to get updated addresses
            if (refreshProfile) {
                await refreshProfile();
            }

            // Select the newly added address
            setSelectedAddress(savedAddress);

            // Reset form and hide it
            setNewAddress({ label: "", street: "", city: "", zipCode: "" });
            setShowAddressForm(false);
        } catch (error) {
            console.error("Error saving address:", error);
            alert("Failed to save address. Please try again.");
        } finally {
            setSavingAddress(false);
        }
    };

    const handleNext = () => {
        // Validation
        if (!selectedAddress) {
            alert("Please select or add an address");
            return;
        }

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

        // Navigate to review page with all data
        const bookingData = {
            serviceId: service!.id,
            serviceName: service!.name,
            servicePrice: service!.price,
            partnerId: partner!.id,
            partnerName: partner!.name,
            type: bookingType,
            scheduledTime: scheduledDateTime.toISOString(),
            location: selectedAddress,
            description,
            notes,
            images: uploadedImages,
            totalAmount: service!.price * (partner?.priceMultiplier || 1),
        };

        // Store in session storage for review page
        sessionStorage.setItem("bookingReviewData", JSON.stringify(bookingData));
        router.push("/booking/review");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!service || !partner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <p className="text-slate-500">Service or partner not found</p>
            </div>
        );
    }

    const hasAddresses = profile?.addresses && profile.addresses.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900">Booking Details</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 pb-32 pt-5 space-y-5">
                {/* Service & Partner Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200/50">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />

                    <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-extrabold mb-1 tracking-tight">{service.name}</h2>
                                <p className="text-blue-100 text-sm font-medium flex items-center gap-1">
                                    <span className="w-1 h-1 bg-blue-200 rounded-full" />
                                    {service.category}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-blue-200 mb-0.5">Base Price</p>
                                <span className="text-3xl font-black">₹{service.price}</span>
                            </div>
                        </div>

                        <div className="pt-3.5 mt-3.5 border-t border-white/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-base font-bold shadow-md">
                                    {partner.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{partner.name}</p>
                                    <div className="flex items-center gap-1 text-blue-200 text-xs mt-0.5">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>{partner.completedJobs} jobs completed</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                                <span className="text-sm font-bold">{partner.rating.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Type */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Booking Type
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {["instant", "scheduled"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setBookingType(type as "instant" | "scheduled")}
                                className={`group relative p-4 rounded-2xl border-2 transition-all duration-200 ${bookingType === type
                                    ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md shadow-blue-200/50"
                                    : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${bookingType === type
                                        ? "bg-blue-600 scale-110"
                                        : "bg-slate-100 group-hover:bg-slate-200"
                                        }`}>
                                        {type === "instant" ? (
                                            <Zap className={`w-6 h-6 ${bookingType === type ? "text-white" : "text-slate-500"}`} />
                                        ) : (
                                            <CalendarIcon className={`w-6 h-6 ${bookingType === type ? "text-white" : "text-slate-500"}`} />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-sm font-bold capitalize ${bookingType === type ? "text-blue-900" : "text-slate-700"}`}>
                                            {type}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {type === "instant" ? "ASAP Service" : "Pick Date & Time"}
                                        </p>
                                    </div>
                                </div>
                                {bookingType === type && (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date & Time - Only for Scheduled */}
                {bookingType === "scheduled" && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2.5">
                            <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                Select Date
                            </p>
                            <div className="bg-white rounded-2xl border-2 border-slate-200 p-3.5 shadow-sm hover:border-blue-300 transition-all focus-within:border-blue-500 focus-within:shadow-md focus-within:shadow-blue-100">
                                <input
                                    type="date"
                                    value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                                    min={format(new Date(), "yyyy-MM-dd")}
                                    className="w-full text-sm font-semibold text-slate-900 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Select Time Slot
                            </p>
                            <div className="space-y-2">
                                {TIME_SLOTS.map((slot) => (
                                    <button
                                        key={slot.value}
                                        onClick={() => setSelectedTimeSlot(slot.value)}
                                        className={`group w-full p-3.5 rounded-2xl border-2 text-left text-sm font-semibold transition-all duration-200 ${selectedTimeSlot === slot.value
                                            ? "border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md shadow-blue-200/50 text-blue-900"
                                            : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm text-slate-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Clock className={`w-4 h-4 ${selectedTimeSlot === slot.value ? "text-blue-600" : "text-slate-400"}`} />
                                                {slot.label}
                                            </span>
                                            {selectedTimeSlot === slot.value && (
                                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-in zoom-in">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Section */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Service Location
                    </p>

                    {/* Saved Addresses */}
                    {hasAddresses && (
                        <div className="space-y-2 mb-3">
                            {profile.addresses.map((addr) => (
                                <button
                                    key={addr.id}
                                    onClick={() => setSelectedAddress(addr)}
                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 ${selectedAddress?.id === addr.id
                                        ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md shadow-blue-200/50"
                                        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedAddress?.id === addr.id ? "bg-blue-600" : "bg-slate-100"
                                            }`}>
                                            <MapPin className={`w-5 h-5 ${selectedAddress?.id === addr.id ? "text-white" : "text-slate-500"}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">{addr.label}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {addr.street}, {addr.city} - {addr.zipCode}
                                            </p>
                                        </div>
                                        {selectedAddress?.id === addr.id && (
                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Add New Address Button/Form */}
                    {!showAddressForm ? (
                        <button
                            onClick={() => setShowAddressForm(true)}
                            className="w-full p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50/50 to-blue-100/50 hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 transition-all text-blue-700 font-semibold text-sm flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {hasAddresses ? "Add Another Address" : "Add Address to Continue"}
                        </button>
                    ) : (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-5 space-y-3 animate-in slide-in-from-top-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-blue-900">New Address</p>
                                <button
                                    onClick={() => {
                                        setShowAddressForm(false);
                                        setNewAddress({ label: "", street: "", city: "", zipCode: "" });
                                    }}
                                    className="w-7 h-7 rounded-full hover:bg-blue-200 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-blue-700" />
                                </button>
                            </div>

                            <div className="space-y-2.5">
                                <Input
                                    placeholder="Label (e.g., Home, Office)"
                                    value={newAddress.label}
                                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                    className="bg-white border-blue-200 focus:border-blue-500"
                                />
                                <Input
                                    placeholder="Street Address"
                                    value={newAddress.street}
                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                    className="bg-white border-blue-200 focus:border-blue-500"
                                />
                                <div className="grid grid-cols-2 gap-2.5">
                                    <Input
                                        placeholder="City"
                                        value={newAddress.city}
                                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                        className="bg-white border-blue-200 focus:border-blue-500"
                                    />
                                    <Input
                                        placeholder="ZIP Code"
                                        value={newAddress.zipCode}
                                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                        className="bg-white border-blue-200 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveAddress}
                                disabled={savingAddress}
                                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl font-bold"
                            >
                                {savingAddress ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Address
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {!hasAddresses && !showAddressForm && (
                        <p className="text-xs text-slate-500 px-1 text-center mt-2">
                            Please add your service location to continue with booking
                        </p>
                    )}
                </div>

                {/* Problem Description */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Describe the Problem *
                    </p>
                    <div className="relative">
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell us what's wrong with your vehicle/appliance..."
                            maxLength={500}
                            className="min-h-[110px] resize-none border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white text-sm shadow-sm hover:border-slate-300 transition-all focus:shadow-md focus:shadow-blue-100"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium">
                            {description.length}/500
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 px-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-blue-500 rounded-full" />
                        Be detailed to help your technician prepare
                    </p>
                </div>

                {/* Special Notes */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Special Instructions (Optional)
                    </p>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any specific requests or notes for the partner..."
                        className="min-h-[80px] resize-none border-2 border-slate-200 focus:border-blue-500 rounded-2xl bg-white text-sm shadow-sm hover:border-slate-300 transition-all focus:shadow-md focus:shadow-blue-100"
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Upload Photos (Optional)
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                        {uploadedImages.map((img, idx) => (
                            <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-sm">
                                <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 hover:scale-110"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {uploadedImages.length < 5 && (
                            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 hover:border-blue-400 cursor-pointer flex flex-col items-center justify-center transition-all shadow-sm hover:shadow-md">
                                {uploading ? (
                                    <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-1.5 shadow-sm">
                                            <Plus className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Add Photo</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 px-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-blue-500 rounded-full" />
                        Upload up to 5 photos ({5 - uploadedImages.length} remaining)
                    </p>
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-50">
                <div className="max-w-md mx-auto px-4 py-4">
                    <Button
                        onClick={handleNext}
                        disabled={!selectedAddress || !description.trim() || submitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-13 rounded-2xl font-bold text-base shadow-lg shadow-blue-300/50 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                Continue to Review
                                <ChevronLeft className="w-4 h-4 rotate-180" />
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function SchedulePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Loading booking details...</p>
                </div>
            </div>
        }>
            <SchedulePageContent />
        </Suspense>
    );
}
