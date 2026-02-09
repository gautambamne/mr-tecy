"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { partnerMatchingService } from "@/services/partner-matching.service";
import { UserProfile, PartnerApplication, Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Star, ShieldCheck, ChevronLeft, User, Wrench } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface BookingData {
    services: Array<Service & { quantity: number }>;
    location: { lat: number; lng: number };
    address: any;
    selfDropMode: boolean;
    totalAmount: number;
    category: string;
    customerName: string;
}

export default function PartnerSelectionPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const toast = useToast();

    const [bookingData, setBookingData] = useState<BookingData | null>(null);
    const [partners, setPartners] = useState<Array<UserProfile & Partial<PartnerApplication>>>([]);
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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

        // Fetch partners for the first service (simplified approach)
        // In a more complex system, you'd match partners for all services
        if (parsedData.services && parsedData.services.length > 0) {
            fetchPartners(parsedData.services[0].id);
        }
    }, [user, authLoading]);

    const fetchPartners = async (serviceId: string) => {
        try {
            const partnersData = await partnerMatchingService.getPartnersForService(serviceId);
            setPartners(partnersData);
        } catch (error) {
            console.error("Error fetching partners:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPartner = () => {
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

        // Navigate to schedule page
        router.push("/booking/schedule");
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">Loading available partners...</p>
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
                        Select a partner to continue with your booking
                    </p>
                </div>

                {/* Partners List */}
                <div className="space-y-3">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Available Partners ({partners.length})
                    </p>

                    {partners.length === 0 ? (
                        <Card className="border-2 border-slate-200">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <User className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1">No Partners Available</h3>
                                <p className="text-sm text-slate-500">
                                    There are no partners currently available for this service. Please try again later.
                                </p>
                                <Button
                                    onClick={() => router.back()}
                                    variant="outline"
                                    className="mt-4"
                                >
                                    Go Back
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        partners.map((partner) => (
                            <Card
                                key={partner.uid}
                                className={cn(
                                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                                    selectedPartner === partner.uid
                                        ? "border-blue-600 bg-blue-50 shadow-lg"
                                        : "border-slate-200 hover:border-blue-300"
                                )}
                                onClick={() => setSelectedPartner(partner.uid)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Partner Avatar */}
                                        <div className={cn(
                                            "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg",
                                            selectedPartner === partner.uid
                                                ? "bg-blue-600 text-white"
                                                : "bg-blue-100 text-blue-700"
                                        )}>
                                            {partner.displayName?.charAt(0).toUpperCase() || "P"}
                                        </div>

                                        {/* Partner Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-slate-900 text-sm truncate">
                                                        {partner.displayName}
                                                    </h3>
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
                                                {selectedPartner === partner.uid && (
                                                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <ShieldCheck className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <div className="bg-slate-50 rounded-lg p-2">
                                                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Completed</p>
                                                    <p className="font-bold text-sm text-slate-900">
                                                        {partner.completedJobs || 0} jobs
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-2">
                                                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Final Price</p>
                                                    <p className="font-bold text-sm text-blue-600">
                                                        ₹{Math.round(bookingData.totalAmount * (partner.priceMultiplier || 1))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] z-50">
                <div className="max-w-md mx-auto">
                    <Button
                        onClick={handleSelectPartner}
                        disabled={!selectedPartner || partners.length === 0}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 sm:h-14 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue to Schedule
                    </Button>
                    {!selectedPartner && partners.length > 0 && (
                        <p className="text-xs text-center text-slate-500 mt-3">
                            Please select a partner to continue
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
