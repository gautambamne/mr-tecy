"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/services/service.service";
import { partnerService } from "@/services/partner.service";
import { bookingService } from "@/services/booking.service";
import { Service, Partner } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Star, ShieldCheck, ChevronLeft, CreditCard } from "lucide-react";
import Link from "next/link";

export default function BookingPage() {
    const { serviceId } = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        if (serviceId) {
            fetchData();
        }
    }, [serviceId]);

    const fetchData = async () => {
        try {
            const [serviceData, partnersData] = await Promise.all([
                serviceService.getServiceById(serviceId as string),
                partnerService.getPartnersByService(serviceId as string)
            ]);
            setService(serviceData);
            setPartners(partnersData);
        } catch (error) {
            console.error("Error fetching booking data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!user || !service || !selectedPartner) {
            alert("Please select a partner first");
            return;
        }

        if (!profile) {
            router.push("/login");
            return;
        }

        setBooking(true);
        try {
            const partner = partners.find(p => p.id === selectedPartner);

            const bookingData = {
                customerId: user.uid,
                customerName: profile.displayName,
                partnerId: selectedPartner,
                partnerName: partner?.name || "Unknown Partner",
                serviceId: service.id,
                serviceName: service.name,
                servicePrice: service.price,
                type: "scheduled" as const,
                scheduledTime: new Date() as any, // Will be converted to Timestamp by Firestore
                location: profile.addresses[0] || {
                    id: 'temp',
                    label: 'Current',
                    street: 'Default St',
                    city: 'Default City',
                    zipCode: '00000'
                },
                description: "Service request - booking via partner selection",
                notes: "",
                images: [],
                paymentMethod: "COD" as const,
                totalAmount: service.price
            };

            await bookingService.createBooking(bookingData);
            router.push("/history");
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Failed to create booking. Please try again.");
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!service) return <div>Service not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            <div className="bg-white border-b px-6 py-4 sticky top-0 z-30 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-extrabold text-slate-900">Select Partner</h1>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-6 pt-6">
                {/* Service Header */}
                <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 rounded-full" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-extrabold">{service.name}</h2>
                                <p className="text-blue-100 text-sm font-medium opacity-90">{service.category}</p>
                            </div>
                            <span className="text-2xl font-extrabold">₹{service.price}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Partners List */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase ml-1">
                        Available Partners for you
                    </h3>

                    {partners.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No partners available right now.</p>
                        </div>
                    ) : (
                        partners.map((partner) => (
                            <div
                                key={partner.id}
                                onClick={() => setSelectedPartner(partner.id)}
                                className={`group cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedPartner === partner.id
                                    ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-100"
                                    : "border-transparent bg-white shadow-sm hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 font-extrabold text-xl overflow-hidden relative border-2 border-white shadow-sm">
                                        {partner.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-extrabold text-slate-900">{partner.name}</h4>
                                            <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                                <Star className="w-4 h-4 fill-amber-500" />
                                                <span>{partner.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mt-1 uppercase tracking-tighter">
                                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                            <span>{partner.completedJobs} Jobs completed</span>
                                        </div>
                                    </div>
                                </div>
                                {selectedPartner === partner.id && (
                                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 text-[10px] font-bold text-blue-600 animate-in fade-in slide-in-from-top-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>Selected for your location</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto flex items-center justify-between gap-6 mr-techy-container">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Payment Method</span>
                        <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span>Cash on Delivery</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleConfirmBooking}
                        disabled={!selectedPartner || booking}
                        className="bg-blue-600 hover:bg-blue-700 h-14 flex-1 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking →"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
