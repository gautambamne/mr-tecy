"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/services/service.service";
import { bookingService } from "@/services/booking.service"; // Import booking service
import { Partner, Service } from "@/types";
import { Button } from "@/components/ui/button";
import { PartnerCard } from "@/components/PartnerCard";
import { ChevronLeft, Loader2, Filter, SlidersHorizontal, Calendar, Clock, MapPin } from "lucide-react"; // Added icons
import { format } from "date-fns"; // Added date-fns

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { partnerService } from "@/services/partner-resource.service";

type SortOption = 'rating' | 'price' | 'jobs';

export default function PartnersPage() {
    const { serviceId } = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Booking context data
    const [bookingContext, setBookingContext] = useState<any>(null);
    const [bookedPartnerIds, setBookedPartnerIds] = useState<string[]>([]);

    // Filters
    const [onlyOnline, setOnlyOnline] = useState(false);
    const [minRating, setMinRating] = useState<number>(0);
    const [sortBy, setSortBy] = useState<SortOption>('rating');

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        // Check for pending booking data
        const pendingDataStr = sessionStorage.getItem("pendingBookingData");
        if (!pendingDataStr) {
            // If no booking data, redirect to schedule page first
            // But check if we are just browsing (maybe distinct route needed? For now enforce flow)
            console.log("No pending booking data, redirecting to schedule");
            router.push(`/schedule?serviceId=${serviceId}`);
            return;
        }

        try {
            const data = JSON.parse(pendingDataStr);
            if (data.serviceId !== serviceId) {
                // Mismatch service, restart
                router.push(`/schedule?serviceId=${serviceId}`);
                return;
            }
            setBookingContext(data);
        } catch (e) {
            console.error("Invalid booking data", e);
            router.push(`/schedule?serviceId=${serviceId}`);
            return;
        }

        if (serviceId) {
            fetchData();
        }
    }, [serviceId, user]);

    useEffect(() => {
        applyFilters();
    }, [partners, onlyOnline, minRating, sortBy, bookedPartnerIds]);

    const fetchData = async () => {
        try {
            // Get booking data again to be sure (state might not be set yet in this scope if closure issue)
            const pendingDataStr = sessionStorage.getItem("pendingBookingData");
            let scheduledTime: Date | null = null;

            if (pendingDataStr) {
                const data = JSON.parse(pendingDataStr);
                scheduledTime = new Date(data.scheduledTime);
            }

            const promises: Promise<any>[] = [
                serviceService.getServiceById(serviceId as string),
                partnerService.getAvailablePartners(
                    serviceId as string,
                    undefined,
                    'rating'
                )
            ];

            // If we have a scheduled time, fetch conflicting bookings
            if (scheduledTime) {
                promises.push(bookingService.getBookedPartnerIds(scheduledTime));
            }

            const results = await Promise.all(promises);
            const serviceData = results[0];
            const partnersData = results[1];
            const busyIds = results[2] || [];

            setService(serviceData);
            setPartners(partnersData);
            setBookedPartnerIds(busyIds);
        } catch (error) {
            console.error("Error fetching partners:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...partners];

        // Filter out booked partners
        if (bookedPartnerIds.length > 0) {
            filtered = filtered.filter(p => !bookedPartnerIds.includes(p.id));
        }

        // Apply availability filter
        if (onlyOnline) {
            filtered = filtered.filter(p => p.availability === 'online');
        }

        // Apply rating filter
        if (minRating > 0) {
            filtered = filtered.filter(p => p.rating >= minRating);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'price':
                    return a.priceMultiplier - b.priceMultiplier;
                case 'jobs':
                    return b.completedJobs - a.completedJobs;
                default:
                    return 0;
            }
        });

        setFilteredPartners(filtered);
    };

    const handleContinue = () => {
        if (!selectedPartner) {
            alert("Please select a partner");
            return;
        }

        // Add selected partner to booking data and move to review
        const partner = partners.find(p => p.id === selectedPartner);
        if (!partner) return;

        const bookingData = {
            ...bookingContext,
            partnerId: partner.id,
            partnerName: partner.name,
            // You might want to recalculate price based on partner multiplier here if needed
            // totalAmount: service.price * partner.priceMultiplier 
        };

        sessionStorage.setItem("bookingReviewData", JSON.stringify(bookingData));
        router.push("/booking/review");
    };

    if (loading) {
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
                    <div className="flex-1">
                        <h1 className="text-xl font-extrabold text-slate-900">Select Partner</h1>
                        {/* Booking Context Summary */}
                        {bookingContext && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(bookingContext.scheduledTime), "MMM d")}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(bookingContext.scheduledTime), "h:mm a")}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Filters Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-full">
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Filters
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filter Partners</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => setOnlyOnline(!onlyOnline)}>
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="checkbox"
                                        checked={onlyOnline}
                                        onChange={() => { }}
                                        className="w-4 h-4"
                                    />
                                    <span>Only Available Now</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Minimum Rating</DropdownMenuLabel>

                            {[0, 3, 4, 4.5].map((rating) => (
                                <DropdownMenuItem
                                    key={rating}
                                    onClick={() => setMinRating(rating)}
                                    className={minRating === rating ? "bg-blue-50" : ""}
                                >
                                    {rating === 0 ? "Any Rating" : `${rating}+ Stars`}
                                </DropdownMenuItem>
                            ))}

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>

                            <DropdownMenuItem
                                onClick={() => setSortBy('rating')}
                                className={sortBy === 'rating' ? "bg-blue-50" : ""}
                            >
                                Highest Rating
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setSortBy('price')}
                                className={sortBy === 'price' ? "bg-blue-50" : ""}
                            >
                                Lowest Price
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setSortBy('jobs')}
                                className={sortBy === 'jobs' ? "bg-blue-50" : ""}
                            >
                                Most Experienced
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-4 pt-6">
                {/* Active Filters */}
                {(onlyOnline || minRating > 0 || sortBy !== 'rating') && (
                    <div className="flex gap-2 flex-wrap">
                        {onlyOnline && (
                            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-2">
                                Available Now
                                <button onClick={() => setOnlyOnline(false)} className="hover:text-green-900">
                                    ×
                                </button>
                            </div>
                        )}
                        {minRating > 0 && (
                            <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-2">
                                {minRating}+ Stars
                                <button onClick={() => setMinRating(0)} className="hover:text-amber-900">
                                    ×
                                </button>
                            </div>
                        )}
                        {sortBy !== 'rating' && (
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                {sortBy === 'price' ? '$ Low to High' : 'Most Experienced'}
                            </div>
                        )}
                    </div>
                )}

                {/* Partners List */}
                <div className="space-y-3">
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase ml-1">
                        {filteredPartners.length} Partner{filteredPartners.length !== 1 ? 's' : ''} Available
                    </h3>

                    {filteredPartners.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-600 font-medium mb-2">No partners match your filters</p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setOnlyOnline(false);
                                    setMinRating(0);
                                    setSortBy('rating');
                                }}
                                className="mt-2"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        filteredPartners.map((partner) => (
                            <PartnerCard
                                key={partner.id}
                                partner={partner}
                                basePrice={service?.price || 0}
                                isSelected={selectedPartner === partner.id}
                                onSelect={() => setSelectedPartner(partner.id)}
                            />
                        ))
                    )}
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto">
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedPartner}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Continue to Review →
                    </Button>
                </div>
            </div>
        </div>
    );
}
