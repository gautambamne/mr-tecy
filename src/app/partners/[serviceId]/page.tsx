"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { partnerService } from "@/services/partner.service";
import { serviceService } from "@/services/service.service";
import { Partner, Service } from "@/types";
import { Button } from "@/components/ui/button";
import { PartnerCard } from "@/components/PartnerCard";
import { ChevronLeft, Loader2, Filter, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

    // Filters
    const [onlyOnline, setOnlyOnline] = useState(false);
    const [minRating, setMinRating] = useState<number>(0);
    const [sortBy, setSortBy] = useState<SortOption>('rating');

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (serviceId) {
            fetchData();
        }
    }, [serviceId, user]);

    useEffect(() => {
        applyFilters();
    }, [partners, onlyOnline, minRating, sortBy]);

    const fetchData = async () => {
        try {
            const [serviceData, partnersData] = await Promise.all([
                serviceService.getServiceById(serviceId as string),
                partnerService.getAvailablePartners(
                    serviceId as string,
                    undefined,
                    'rating'
                )
            ]);

            setService(serviceData);
            setPartners(partnersData);
        } catch (error) {
            console.error("Error fetching partners:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...partners];

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

    const handleContinueToSchedule = () => {
        if (!selectedPartner) {
            alert("Please select a partner");
            return;
        }

        // Add selected partner to session storage
        const bookingData = JSON.parse(sessionStorage.getItem("bookingData") || "{}");
        bookingData.partnerId = selectedPartner;
        bookingData.partnerName = partners.find(p => p.id === selectedPartner)?.name || "";
        sessionStorage.setItem("bookingData", JSON.stringify(bookingData));

        router.push("/schedule");
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
                        {service && (
                            <p className="text-sm text-slate-600">{service.name}</p>
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
                        onClick={handleContinueToSchedule}
                        disabled={!selectedPartner}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Continue to Schedule →
                    </Button>
                </div>
            </div>
        </div>
    );
}
