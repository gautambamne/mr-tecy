"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/services/service.service";
import { partnerMatchingService } from "@/services/partner-matching.service";
import { Service, UserProfile, PartnerApplication } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Star, ShieldCheck, ChevronLeft, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function BookingPage() {
    const { serviceId } = useParams();
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const toast = useToast();

    const [service, setService] = useState<Service | null>(null);
    const [partners, setPartners] = useState<Array<UserProfile & Partial<PartnerApplication>>>([]);
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        // Redirect to login if not authenticated
        if (!user) {
            router.push("/login");
            return;
        }

        if (serviceId) {
            fetchData();
        }
    }, [serviceId, user, authLoading]);

    const fetchData = async () => {
        try {
            const [serviceData, partnersData] = await Promise.all([
                serviceService.getServiceById(serviceId as string),
                partnerMatchingService.getPartnersForService(serviceId as string)
            ]);
            setService(serviceData);
            setPartners(partnersData);
        } catch (error) {
            console.error("Error fetching booking data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPartner = () => {
        if (!selectedPartner) {
            alert("Please select a partner first");
            return;
        }


        if (!user) {
            router.push("/login");
            return;
        }

        // Prevent partners from booking their own service
        if (user.uid === selectedPartner) {
            toast.error("Action Failed", "You cannot access your own service");
            return;
        }

        // Navigate to schedule page with service and partner IDs
        router.push(`/schedule?serviceId=${service?.id}&partnerId=${selectedPartner}`);
    };

    // Show loading while auth is initializing or data is loading
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

    // Redirect unauthenticated users - don't show any content
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Only show "not found" after confirming user is authenticated
    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Service Not Found</h2>
                        <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                            The service you are looking for ({serviceId}) does not exist or has been removed.
                        </p>
                    </div>
                    <Button onClick={() => router.push("/")} variant="outline" className="min-w-[140px]">
                        Go to Home
                    </Button>
                </div>
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
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">Select Partner</h1>
            </div>

            <main className="relative z-10 max-w-md mx-auto p-4 sm:p-6 space-y-6 pt-6">
                {/* Service Header */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 rounded-full" />
                    <div className="absolute left-0 bottom-0 w-24 h-24 bg-white/5 blur-2xl -ml-10 -mb-10 rounded-full" />
                    <CardContent className="p-5 sm:p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black mb-1">{service.name}</h2>
                                <p className="text-blue-100 text-xs sm:text-sm font-semibold opacity-90">{service.category}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl sm:text-3xl font-black">₹{service.price}</span>
                                <p className="text-blue-100 text-[10px] font-bold opacity-80 mt-0.5">{service.durationMinutes} min</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Partners List */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-extrabold tracking-[0.15em] text-slate-500 uppercase ml-1">
                        Available Partners ({partners.length})
                    </h3>

                    {partners.length === 0 ? (
                        <div className="text-center py-16 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-bold text-sm">No partners available right now</p>
                            <p className="text-slate-400 text-xs mt-1">Please check back later</p>
                        </div>
                    ) : (
                        partners.map((partner) => (
                            <div
                                key={partner.uid}
                                onClick={() => setSelectedPartner(partner.uid)}
                                className={`group cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedPartner === partner.uid
                                    ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-100"
                                    : "border-transparent bg-white shadow-sm hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl overflow-hidden relative border-2 border-white shadow-lg">
                                        {partner.displayName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h4 className="font-black text-slate-900 text-base sm:text-lg truncate">{partner.displayName}</h4>
                                            <div className="flex items-center gap-1 text-slate-500 font-bold text-xs flex-shrink-0">
                                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                                <span>{partner.experience || 0} yrs</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                                            <span>{partner.skills?.slice(0, 2).join(', ') || 'General'}</span>
                                        </div>
                                    </div>
                                </div>
                                {selectedPartner === partner.uid && (
                                    <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-[11px] font-extrabold text-blue-600 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>Selected • {partner.serviceArea || 'Your location'}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] z-50">
                <div className="max-w-md mx-auto flex items-center justify-between gap-4 sm:gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Payment</span>
                        <div className="flex items-center gap-1.5 font-black text-slate-800">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Cash on Delivery</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleSelectPartner}
                        disabled={!selectedPartner}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 sm:h-14 flex-1 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue to Schedule →
                    </Button>
                </div>
            </div>
        </div>
    );
}
