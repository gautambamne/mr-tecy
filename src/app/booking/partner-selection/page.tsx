'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { partnerMatchingService } from "@/services/partner-matching.service";
import { bookingService } from "@/services/booking.service";
import { UserProfile, PartnerApplication, Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Star, ShieldCheck, ChevronLeft, User, Wrench, AlertCircle, Info, DollarSign, ChevronDown, ChevronUp, X, MapPin } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { calculateBookingEndTime, parseTimeSlot } from "@/utils/time-overlap.util";
import { calculateDistance, formatDistance, calculateDistanceCharge } from "@/utils/distance.util";

interface BookingData {
    services: Array<Service & { quantity: number }>;
    location: { lat: number; lng: number };
    address: any;
    selfDropMode: boolean;
    totalAmount: number;
    category: string;
    customerName: string;
    scheduledTime?: string;
    bookingType?: string;
}

export default function PartnerSelectionPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const toast = useToast();

    const [bookingData, setBookingData] = useState<BookingData | null>(null);
    const [partners, setPartners] = useState<Array<UserProfile & Partial<PartnerApplication>>>([]);
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [unavailablePartners, setUnavailablePartners] = useState<string[]>([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availablePartnerCount, setAvailablePartnerCount] = useState(0);
    const [showMoreSection, setShowMoreSection] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState<string | null>(null);

    // Initial load: Load booking data and partners
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

        const parsedData = JSON.parse(data);
        setBookingData(parsedData);

        const initData = async () => {
            try {
                // Fetch partners for the first service
                if (parsedData.services && parsedData.services.length > 0) {
                    const partnersData = await partnerMatchingService.getPartnersForService(parsedData.services[0].id);
                    console.log("[PartnerSelection] Booking Data:", parsedData);
                    console.log("[PartnerSelection] Partners Found:", partnersData);
                    partnersData.forEach(p => console.log(`Partner ${p.displayName} location:`, p.location));
                    setPartners(partnersData);
                }
            } catch (error) {
                console.error("Error initializing partner selection:", error);
            } finally {
                setLoading(false);
            }
        };

        initData();

    }, [user, authLoading]);

    // AUTO-REFRESH: Check partner availability whenever date/time or partners change
    useEffect(() => {
        // Only run if we have booking data with scheduled time and partners
        if (!bookingData || !bookingData.scheduledTime || partners.length === 0) {
            return;
        }

        // Skip for instant bookings (no time conflict check needed)
        if (bookingData.bookingType === 'instant') {
            setUnavailablePartners([]);
            setAvailablePartnerCount(partners.length);
            return;
        }

        const checkAvailability = async () => {
            setCheckingAvailability(true);
            try {
                const scheduledTime = new Date(bookingData.scheduledTime!);
                const selectedEnd = calculateBookingEndTime(scheduledTime);

                // Get all partner IDs
                const partnerIds = partners.map(p => p.uid);

                // Check availability using optimized method
                const busyPartnerIds = await bookingService.getBookedPartnerIds(scheduledTime, partnerIds);

                setUnavailablePartners(busyPartnerIds);
                const available = partners.filter(p => !busyPartnerIds.includes(p.uid)).length;
                setAvailablePartnerCount(available);

                // Clear selection if selected partner became busy
                if (selectedPartner && busyPartnerIds.includes(selectedPartner)) {
                    setSelectedPartner(null);
                    toast.warning("Partner Unavailable", "The selected partner is no longer available for this time slot");
                }
            } catch (error) {
                console.error("Error checking partner availability:", error);
            } finally {
                setCheckingAvailability(false);
            }
        };

        checkAvailability();

    }, [bookingData?.scheduledTime, partners]);

    // Helper functions
    const isPartnerBusy = (partnerId: string) => unavailablePartners.includes(partnerId);

    const getPriceIndicator = (multiplier: number = 1, isSelfDrop: boolean = false) => {
        if (isSelfDrop) return ''; // No distance charge for self drop mode
        if (multiplier <= 1.0) return '$';
        if (multiplier <= 1.5) return '$$';
        return '$$$';
    };

    const calculateFinalPrice = (
        baseAmount: number,
        partner: UserProfile,
        isFromAdditionalSection: boolean = false
    ) => {
        let finalPrice = baseAmount * (partner.priceMultiplier || 1);

        // Apply 20% additional charge for "More Available Partners" section
        if (isFromAdditionalSection) {
            finalPrice *= 1.2;
        }

        // Distance Charge logic
        if (!bookingData?.selfDropMode && partner.location && bookingData?.location) {
            const dist = calculateDistance(
                bookingData.location.lat,
                bookingData.location.lng,
                partner.location.lat,
                partner.location.lng
            );
            const charge = calculateDistanceCharge(dist);
            finalPrice += charge;
        }

        return Math.round(finalPrice);
    };

    const handlePartnerClick = async (partnerId: string) => {
        const isBusy = isPartnerBusy(partnerId);

        if (isBusy) {
            toast.error("Partner Unavailable", "This partner is busy at the selected time slot");
            return;
        }

        // Real-time re-check before selection (for scheduled bookings)
        if (bookingData?.bookingType === 'scheduled' && bookingData.scheduledTime) {
            try {
                const scheduledTime = new Date(bookingData.scheduledTime);
                const selectedEnd = calculateBookingEndTime(scheduledTime);

                const availabilityCheck = await bookingService.checkPartnerAvailability(
                    partnerId,
                    scheduledTime,
                    selectedEnd
                );

                if (!availabilityCheck.available) {
                    toast.error("Partner Just Became Busy", "This partner was just booked for this time slot. Please select another partner.");
                    // Refresh availability list
                    const busyPartnerIds = await bookingService.getBookedPartnerIds(scheduledTime, partners.map(p => p.uid));
                    setUnavailablePartners(busyPartnerIds);
                    return;
                }
            } catch (error) {
                console.error("Error checking partner availability:", error);
                toast.error("Error", "Unable to verify partner availability. Please try again.");
                return;
            }
        }

        setSelectedPartner(partnerId);
    };

    const handleSelectPartner = async () => {
        if (!selectedPartner) {
            alert("Please select a partner first");
            return;
        }

        if (!user || !bookingData) {
            router.push("/login");
            return;
        }

        // Prevent partners from booking their own service
        if (user.uid === selectedPartner) {
            toast.error("Action Failed", "You cannot book your own service");
            return;
        }

        // DOUBLE BOOKING PREVENTION: Final check before confirming
        if (bookingData.bookingType === 'scheduled' && bookingData.scheduledTime) {
            try {
                const scheduledTime = new Date(bookingData.scheduledTime);
                const selectedEnd = calculateBookingEndTime(scheduledTime);

                const finalCheck = await bookingService.checkPartnerAvailability(
                    selectedPartner,
                    scheduledTime,
                    selectedEnd
                );

                if (!finalCheck.available) {
                    toast.error(
                        "Partner No Longer Available",
                        "This partner was just booked by another customer. Please select a different partner."
                    );
                    // Refresh the list
                    const busyPartnerIds = await bookingService.getBookedPartnerIds(scheduledTime, partners.map(p => p.uid));
                    setUnavailablePartners(busyPartnerIds);
                    setSelectedPartner(null);
                    return;
                }
            } catch (error) {
                console.error("Error with final availability check:", error);
                toast.error("Error", "Unable to confirm booking. Please try again.");
                return;
            }
        }

        const partner = partners.find(p => p.uid === selectedPartner);
        if (!partner) return;

        // Store partner data in session
        const updatedBookingData = {
            ...bookingData,
            partnerId: selectedPartner,
            partnerName: partner.displayName,
            partnerRating: partner.rating || 0,
            priceMultiplier: partner.priceMultiplier || 1,
        };

        sessionStorage.setItem("myBookingData", JSON.stringify(updatedBookingData));

        // Navigate to review page (Reverse Flow: Partner -> Review)
        router.push("/booking/review");
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">Finding best partners...</p>
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

    // Split partners into two sections with SORTING: Active first, then Busy
    // This ensures the first 3 partners are prioritized by availability
    const sortedPartners = [...partners].sort((a, b) => {
        const aIsBusy = unavailablePartners.includes(a.uid);
        const bIsBusy = unavailablePartners.includes(b.uid);

        // Active partners come first
        if (aIsBusy && !bIsBusy) return 1;
        if (!aIsBusy && bIsBusy) return -1;

        // Then sort by distance (Nearest first)
        if (!bookingData?.location) return 0;

        const distA = a.location ? calculateDistance(bookingData.location.lat, bookingData.location.lng, a.location.lat, a.location.lng) : 99999;
        const distB = b.location ? calculateDistance(bookingData.location.lat, bookingData.location.lng, b.location.lat, b.location.lng) : 99999;

        return distA - distB;
    });

    // Section 1: First 3 partners (Active prioritized, then Busy)
    const firstThreePartners = sortedPartners.slice(0, 3);

    // Check if all first 3 are busy
    const allFirstThreeBusy = firstThreePartners.every(p => unavailablePartners.includes(p.uid));

    // Section 2: Additional ACTIVE partners only (no busy partners)
    const additionalActivePartners = sortedPartners
        .slice(3)
        .filter(p => !unavailablePartners.includes(p.uid));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-32">
            {/* Premium Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-blue-100/40 via-cyan-50/30 to-transparent pointer-events-none" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-0 z-30 flex items-center gap-3 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-slate-100 rounded-xl">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    Select Partner
                </h1>
            </div>

            <main className="relative z-10 max-w-md mx-auto p-4 sm:p-6 space-y-6 pt-6">
                {/* Services Summary */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 rounded-full" />
                    <CardContent className="p-5 sm:p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black mb-1">
                                    {bookingData.services.length === 1
                                        ? bookingData.services[0].name
                                        : `${bookingData.services.length} Services`}
                                </h2>
                                <p className="text-blue-100 text-xs sm:text-sm font-semibold opacity-90 capitalize">
                                    {bookingData.category || "Multiple Categories"}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl sm:text-3xl font-black">₹{bookingData.totalAmount}</span>
                                <p className="text-blue-100 text-[10px] font-bold opacity-80 mt-0.5">Base Total</p>
                            </div>
                        </div>

                        {bookingData.services.length > 1 && (
                            <div className="pt-3 border-t border-blue-400/30">
                                <p className="text-xs text-blue-200 font-semibold mb-2">Selected Services:</p>
                                <div className="space-y-1">
                                    {bookingData.services.map((service, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-blue-50">
                                                {service.name} × {service.quantity}
                                            </span>
                                            <span className="font-bold">₹{service.price * service.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Instruction */}
                <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        {checkingAvailability ? "Checking availability..." : "Select a partner to continue with your booking"}
                    </p>
                    {bookingData.bookingType === 'scheduled' && (
                        <p className="text-xs text-blue-700 mt-1">
                            {availablePartnerCount} of {partners.length} partners available for this time slot
                        </p>
                    )}
                </div>

                {/* Warning if all first 3 are busy */}
                {bookingData.bookingType === 'scheduled' && allFirstThreeBusy && firstThreePartners.length > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-900 mb-1">
                                    Selected partners are unavailable for this time
                                </p>
                                <p className="text-xs text-amber-700">
                                    Please choose another time slot or check the additional partners section below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 1: Top 3 Nearest Partners */}
                <div className="space-y-3">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Top 3 Nearest Partners
                    </p>

                    {firstThreePartners.length === 0 ? (
                        <Card className="border-2 border-slate-200">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <User className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1">No Partners Available</h3>
                                <p className="text-sm text-slate-500">
                                    {bookingData.bookingType === 'scheduled'
                                        ? "No partners available for the selected time slot."
                                        : "There are no partners currently available for this service."}
                                    Please try a different time or try again later.
                                </p>
                                <Button
                                    onClick={() => router.back()}
                                    variant="outline"
                                    className="mt-4"
                                >
                                    Change Time
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        firstThreePartners.map((partner) => {
                            const isBusy = isPartnerBusy(partner.uid);
                            const priceIndicator = getPriceIndicator(
                                partner.priceMultiplier,
                                bookingData?.selfDropMode || false
                            );
                            const isSelected = selectedPartner === partner.uid;
                            const finalPrice = calculateFinalPrice(
                                bookingData.totalAmount,
                                partner,
                                false // Not from additional section
                            );

                            return (
                                <Card
                                    key={partner.uid}
                                    className={cn(
                                        "transition-all duration-200 hover:shadow-lg border-2 relative",
                                        isBusy
                                            ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50"
                                            : "cursor-pointer",
                                        !isBusy && isSelected
                                            ? "border-blue-600 bg-blue-50 shadow-lg"
                                            : !isBusy && "border-slate-200 hover:border-blue-300"
                                    )}
                                    onClick={() => handlePartnerClick(partner.uid)}
                                >
                                    {/* Status Badge */}
                                    {(!isSelected || isBusy) && (
                                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide",
                                                isBusy
                                                    ? "bg-red-100 text-red-700 border border-red-300"
                                                    : "bg-green-100 text-green-700 border border-green-300"
                                            )}>
                                                {isBusy ? "Busy" : "Active"}
                                            </div>

                                            {/* Distance Badge */}
                                            {partner.location && bookingData?.location && (
                                                <div className="px-2 py-0.5 rounded-md bg-slate-100/80 backdrop-blur-sm border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1 shadow-sm">
                                                    <MapPin className="w-3 h-3 text-blue-500" />
                                                    {formatDistance(calculateDistance(
                                                        bookingData.location.lat,
                                                        bookingData.location.lng,
                                                        partner.location.lat,
                                                        partner.location.lng
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Partner Avatar */}
                                            <div className={cn(
                                                "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg",
                                                isBusy
                                                    ? "bg-slate-200 text-slate-500"
                                                    : isSelected
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-blue-100 text-blue-700"
                                            )}>
                                                {partner.displayName?.charAt(0).toUpperCase() || "P"}
                                            </div>

                                            {/* Partner Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className={cn(
                                                        "min-w-0 flex-1",
                                                        (!isSelected || isBusy) && "pr-20"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={cn(
                                                                "font-bold text-sm truncate",
                                                                isBusy ? "text-slate-500" : "text-slate-900"
                                                            )}>
                                                                {partner.displayName}
                                                            </h3>

                                                            {/* Price Indicator */}
                                                            <span className={cn(
                                                                "text-sm font-extrabold",
                                                                isBusy ? "text-slate-400" : "text-green-600"
                                                            )}>
                                                                {priceIndicator}
                                                            </span>

                                                            {/* Info Icon */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowInfoModal(partner.uid);
                                                                }}
                                                                className={cn(
                                                                    "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                                                                    isBusy
                                                                        ? "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                                                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                                )}
                                                            >
                                                                <Info className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Star className={cn(
                                                                "w-3.5 h-3.5 fill-yellow-400",
                                                                isBusy ? "text-yellow-300" : "text-yellow-400"
                                                            )} />
                                                            <span className={cn(
                                                                "text-xs font-bold",
                                                                isBusy ? "text-slate-500" : "text-slate-700"
                                                            )}>
                                                                {partner.rating?.toFixed(1) || "0.0"}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                ({partner.reviewCount || 0} reviews)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Selection Indicator */}
                                                    {!isBusy && isSelected && (
                                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <ShieldCheck className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <div className={cn(
                                                        "rounded-lg p-2",
                                                        isBusy ? "bg-slate-100" : "bg-slate-50"
                                                    )}>
                                                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Completed</p>
                                                        <p className={cn(
                                                            "font-bold text-sm",
                                                            isBusy ? "text-slate-500" : "text-slate-900"
                                                        )}>
                                                            {partner.completedJobs || 0} jobs
                                                        </p>
                                                    </div>
                                                    <div className={cn(
                                                        "rounded-lg p-2",
                                                        isBusy ? "bg-slate-100" : "bg-slate-50"
                                                    )}>
                                                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Final Price</p>
                                                        <p className={cn(
                                                            "font-bold text-sm",
                                                            isBusy ? "text-slate-500" : "text-blue-600"
                                                        )}>
                                                            ₹{finalPrice}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}

                </div>

                {/* Section 2: More Available Mr Tecy Partners */}
                {additionalActivePartners.length > 0 && (
                    <div className="space-y-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowMoreSection(!showMoreSection)}
                            className="w-full rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                            {showMoreSection ? (
                                <>
                                    <ChevronUp className="w-4 h-4 mr-2" />
                                    Hide More Available Partners
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4 mr-2" />
                                    Show {additionalActivePartners.length} More Available Mr Tecy Partners
                                </>
                            )}
                        </Button>

                        {showMoreSection && (
                            <>
                                <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs font-semibold text-amber-900">
                                        Selecting partners from this section will have <span className="font-extrabold">20% higher charges</span> compared to the top 3 nearest partners.
                                    </p>
                                </div>

                                {additionalActivePartners.map((partner) => {
                                    const isBusy = false; // All are Active in this section
                                    const priceIndicator = getPriceIndicator(
                                        partner.priceMultiplier,
                                        bookingData?.selfDropMode || false
                                    );
                                    const isSelected = selectedPartner === partner.uid;
                                    const finalPrice = calculateFinalPrice(
                                        bookingData.totalAmount,
                                        partner,
                                        true // From additional section - higher charge
                                    );

                                    return (
                                        <Card
                                            key={partner.uid}
                                            className={cn(
                                                "transition-all duration-200 hover:shadow-lg border-2 relative cursor-pointer",
                                                isSelected
                                                    ? "border-blue-600 bg-blue-50 shadow-lg"
                                                    : "border-slate-200 hover:border-blue-300"
                                            )}
                                            onClick={() => handlePartnerClick(partner.uid)}
                                        >
                                            {/* Status Badge */}
                                            {!isSelected && (
                                                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide z-10 bg-green-100 text-green-700 border border-green-300">
                                                    Active
                                                </div>
                                            )}

                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    {/* Partner Avatar */}
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg",
                                                        isSelected
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {partner.displayName?.charAt(0).toUpperCase() || "P"}
                                                    </div>

                                                    {/* Partner Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className={cn(
                                                                "min-w-0 flex-1",
                                                                !isSelected && "pr-20"
                                                            )}>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-bold text-sm truncate text-slate-900">
                                                                        {partner.displayName}
                                                                    </h3>

                                                                    {/* Price Indicator */}
                                                                    <span className="text-sm font-extrabold text-green-600">
                                                                        {priceIndicator}
                                                                    </span>

                                                                    {/* Info Icon */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowInfoModal(partner.uid);
                                                                        }}
                                                                        className="w-5 h-5 rounded-full flex items-center justify-center transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                                    >
                                                                        <Info className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                                    <span className="text-xs font-bold text-slate-700">
                                                                        {partner.rating?.toFixed(1) || "0.0"}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        ({partner.reviewCount || 0} reviews)
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Selection Indicator */}
                                                            {isSelected && (
                                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <ShieldCheck className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Stats */}
                                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                                            <div className="rounded-lg p-2 bg-slate-50">
                                                                <p className="text-[10px] text-slate-500 font-semibold uppercase">Completed</p>
                                                                <p className="font-bold text-sm text-slate-900">
                                                                    {partner.completedJobs || 0} jobs
                                                                </p>
                                                            </div>
                                                            <div className="rounded-lg p-2 bg-slate-50">
                                                                <p className="text-[10px] text-slate-500 font-semibold uppercase">Final Price</p>
                                                                <p className="font-bold text-sm text-blue-600">
                                                                    ₹{finalPrice}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}

                {/* Partner Info Modal */}
                {showInfoModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowInfoModal(null)}
                    >
                        <Card className="max-w-md w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CardContent className="p-6">
                                {(() => {
                                    const partner = partners.find(p => p.uid === showInfoModal);
                                    if (!partner) return null;

                                    const isBusy = isPartnerBusy(partner.uid);
                                    const priceIndicator = getPriceIndicator(partner.priceMultiplier);

                                    return (
                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl",
                                                        isBusy ? "bg-slate-200 text-slate-500" : "bg-blue-600 text-white"
                                                    )}>
                                                        {partner.displayName?.charAt(0).toUpperCase() || "P"}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900">{partner.displayName}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "text-xs font-extrabold px-2 py-0.5 rounded-full",
                                                                isBusy
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-green-100 text-green-700"
                                                            )}>
                                                                {isBusy ? "Busy" : "Active"}
                                                            </span>
                                                            <span className="text-sm font-extrabold text-green-600">
                                                                {priceIndicator}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowInfoModal(null)}
                                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-50 rounded-xl p-3">
                                                    <p className="text-xs text-slate-500 font-semibold uppercase">Rating</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        <p className="font-bold text-lg">{partner.rating?.toFixed(1) || "0.0"}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-3">
                                                    <p className="text-xs text-slate-500 font-semibold uppercase">Reviews</p>
                                                    <p className="font-bold text-lg mt-1">{partner.reviewCount || 0}</p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-3">
                                                    <p className="text-xs text-slate-500 font-semibold uppercase">Completed Jobs</p>
                                                    <p className="font-bold text-lg mt-1">{partner.completedJobs || 0}</p>
                                                </div>
                                                <div className="bg-blue-50 rounded-xl p-3">
                                                    <p className="text-xs text-blue-600 font-semibold uppercase">Price Multiplier</p>
                                                    <p className="font-bold text-lg text-blue-600 mt-1">{partner.priceMultiplier || 1}x</p>
                                                </div>
                                            </div>

                                            {/* Location & Distance */}
                                            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                                                {partner.location ? (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs text-slate-500 font-semibold uppercase mb-0.5">Location</p>
                                                            <p className="text-sm font-bold text-slate-900 line-clamp-2">
                                                                {partner.location.address || "Location coordinates set"}
                                                            </p>
                                                            {bookingData?.location ? (
                                                                <p className="text-xs font-bold text-blue-600 mt-1 bg-blue-100/50 inline-block px-2 py-0.5 rounded-md">
                                                                    {formatDistance(calculateDistance(
                                                                        bookingData.location.lat,
                                                                        bookingData.location.lng,
                                                                        partner.location.lat,
                                                                        partner.location.lng
                                                                    ))} away
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs text-amber-600 mt-1">Distance unavailable (User location missing)</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-red-500 font-bold flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Partner Location Not Set
                                                    </div>
                                                )}
                                            </div>

                                            {/* Experience */}
                                            {partner.experience && (
                                                <div>
                                                    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Experience</p>
                                                    <p className="text-sm text-slate-700">{partner.experience}</p>
                                                </div>
                                            )}

                                            {/* Specialties */}
                                            {(partner as any).specialties && (partner as any).specialties.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Specialties</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {((partner as any).specialties as string[]).map((specialty: string, idx: number) => (
                                                            <span key={idx} className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                                {specialty}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Contact */}
                                            <div className="pt-3 border-t border-slate-200">
                                                <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Contact</p>
                                                <p className="text-sm text-slate-700">{partner.email || partner.phoneNumber || "Not available"}</p>
                                            </div>

                                            {/* Action Button */}
                                            {!isBusy && (
                                                <Button
                                                    onClick={() => {
                                                        setSelectedPartner(partner.uid);
                                                        setShowInfoModal(null);
                                                    }}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl"
                                                >
                                                    Select This Partner
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 safe-area-inset-bottom z-10">
                <div className="max-w-md mx-auto">
                    {selectedPartner ? (
                        <Button
                            onClick={handleSelectPartner}
                            size="lg"
                            className="w-full text-base font-bold py-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                        >
                            Continue to Review
                        </Button>
                    ) : (
                        <p className="text-xs text-center text-slate-500 mt-3">
                            Please select a partner to continue
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
