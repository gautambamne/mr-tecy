"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { serviceService } from "@/services/service.service";
import { Service } from "@/types";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Wrench, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SERVICE_CATEGORIES, CATEGORY_DISPLAY_NAMES } from "@/constants/categories";

export default function ServicesPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const categories = ["All", ...SERVICE_CATEGORIES.map(cat => CATEGORY_DISPLAY_NAMES[cat])];

    useEffect(() => {
        async function fetchServices() {
            try {
                const data = await serviceService.getServices();
                setServices(data);
                setFilteredServices(data);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchServices();
    }, []);

    useEffect(() => {
        let result = services;

        // Filter by search
        if (searchQuery) {
            result = result.filter(
                (s) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== "All") {
            result = result.filter(
                (s) => s.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        setFilteredServices(result);
    }, [searchQuery, selectedCategory, services]);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#A1F6FB] via-[#DBFDFC] to-slate-50 pointer-events-none" />

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 py-3 sticky top-0 z-30 shadow-sm space-y-4">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="w-9 h-9 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-700" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Book a Service</h1>
                            <p className="text-xs text-slate-500">Choose from available services</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="max-w-md mx-auto space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search available services..."
                            className="pl-10 h-11 rounded-xl border-2 border-slate-200 focus:border-blue-400 bg-white shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pt-4 space-y-6 relative z-10">
                {/* Results Count */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                        {loading ? "Loading..." : `${filteredServices.length} Services Available`}
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-28 w-full rounded-2xl" />
                                <Skeleton className="h-4 w-3/4 rounded-full" />
                                <Skeleton className="h-4 w-1/2 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : filteredServices.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {filteredServices.map((service) => (
                            <Link key={service.id} href={`/booking?serviceId=${service.id}`}>
                                <ServiceCard
                                    title={service.name}
                                    description={service.description}
                                    image={
                                        service.iconUrl ||
                                        `https://source.unsplash.com/400x300/?${service.category.toLowerCase()}`
                                    }
                                    price={`₹${service.price}`}
                                />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="mt-12">
                        {/* Premium Empty State */}
                        <div className="relative">
                            {/* Decorative circles */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-60" />

                            <div className="relative bg-white rounded-3xl border-2 border-slate-200 p-8 text-center shadow-lg">
                                {/* Icon */}
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-md">
                                    <Wrench className="w-10 h-10 text-slate-400" />
                                </div>

                                {/* Text */}
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Services Found</h3>
                                <p className="text-slate-500 text-sm max-w-[240px] mx-auto leading-relaxed mb-6">
                                    {searchQuery || selectedCategory !== "All"
                                        ? "Try adjusting your search or filters to find what you're looking for."
                                        : "No services are currently available. Please check back soon!"}
                                </p>

                                {/* Action */}
                                {(searchQuery || selectedCategory !== "All") && (
                                    <Button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedCategory("All");
                                        }}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-full font-bold shadow-lg shadow-blue-300/50"
                                    >
                                        Clear All Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
