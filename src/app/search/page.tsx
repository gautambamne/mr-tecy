"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { serviceService } from "@/services/service.service";
import { Service } from "@/types";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search as SearchIcon, Loader2, X } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { SERVICE_CATEGORIES, CATEGORY_DISPLAY_NAMES } from "@/constants/categories";

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const initialCategory = searchParams.get("category") || "";

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [category, setCategory] = useState(initialCategory);
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Load services
    useEffect(() => {
        async function fetchServices() {
            try {
                const data = await serviceService.getServices();
                setServices(data);
                filterServices(data, searchQuery, category);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchServices();
    }, []);

    // Load search history from localStorage
    useEffect(() => {
        const history = localStorage.getItem("searchHistory");
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

    // Filter services whenever search query or category changes
    useEffect(() => {
        filterServices(services, searchQuery, category);
    }, [searchQuery, category, services]);

    const filterServices = (
        allServices: Service[],
        query: string,
        cat: string
    ) => {
        let filtered = allServices;

        // Filter by category if selected
        if (cat) {
            filtered = filtered.filter(
                (service) => service.category.toLowerCase() === cat.toLowerCase()
            );
        }

        // Filter by search query
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(
                (service) =>
                    service.name.toLowerCase().includes(lowerQuery) ||
                    service.description.toLowerCase().includes(lowerQuery) ||
                    service.category.toLowerCase().includes(lowerQuery)
            );
        }

        setFilteredServices(filtered);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        // Update URL
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (category) params.set("category", category);
        const queryString = params.toString();
        router.replace(`/search${queryString ? `?${queryString}` : ""}`);

        // Save to search history if query is not empty
        if (query.trim() && !searchHistory.includes(query.trim())) {
            const newHistory = [query.trim(), ...searchHistory.slice(0, 4)]; // Keep only 5 recent searches
            setSearchHistory(newHistory);
            localStorage.setItem("searchHistory", JSON.stringify(newHistory));
        }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        router.replace("/search");
    };

    const handleCategoryChange = (cat: string) => {
        const newCategory = category === cat ? "" : cat;
        setCategory(newCategory);

        // Update URL
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (newCategory) params.set("category", newCategory);
        const queryString = params.toString();
        router.replace(`/search${queryString ? `?${queryString}` : ""}`);
    };

    const categories = SERVICE_CATEGORIES.map(cat => CATEGORY_DISPLAY_NAMES[cat]);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#A1F6FB] via-[#DBFDFC] to-slate-50 pointer-events-none" />

            {/* Header */}
            <div className="bg-transparent px-4 py-4 sticky top-0 z-30 backdrop-blur-sm">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="hover:bg-white/50 flex-shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search services..."
                                className="pl-12 pr-12 h-12 rounded-full border-2 border-slate-200 focus:border-blue-400 bg-white shadow-sm"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${category === cat
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6 relative z-10">
                {/* Search History */}
                {!searchQuery && searchHistory.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase px-1">
                            Recent Searches
                        </h2>
                        <div className="space-y-2">
                            {searchHistory.map((query, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSearch(query)}
                                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <SearchIcon className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-700">{query}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="space-y-3">
                    {searchQuery || category ? (
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                                {loading
                                    ? "Searching..."
                                    : `${filteredServices.length} Result${filteredServices.length !== 1 ? "s" : ""
                                    }`}
                            </h2>
                            {(searchQuery || category) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setCategory("");
                                        router.replace("/search");
                                    }}
                                    className="text-sm text-blue-600 font-bold hover:text-blue-700"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
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
                                <Link key={service.id} href={`/booking/${service.id}`}>
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
                    ) : searchQuery || category ? (
                        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <SearchIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">
                                No results found
                            </h3>
                            <p className="text-slate-500 text-sm max-w-[200px] mx-auto leading-relaxed">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <SearchIcon className="w-8 h-8 text-blue-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">
                                Search for services
                            </h3>
                            <p className="text-slate-500 text-sm max-w-[200px] mx-auto leading-relaxed">
                                Find the perfect service for your needs
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Loading search...</p>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
