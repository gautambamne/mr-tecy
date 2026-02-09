"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { serviceService } from "@/services/service.service";
import { Service } from "@/types";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Wrench } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { migrateLegacyCategory, CATEGORY_DISPLAY_NAMES } from "@/constants/categories";

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categoryName = Array.isArray(params.categoryName)
        ? params.categoryName[0]
        : params.categoryName;

    // Normalize the category (handle both old and new URL formats)
    const normalizedCategory = categoryName ? migrateLegacyCategory(categoryName) : null;

    // Get display name from constants
    const displayCategory = normalizedCategory
        ? CATEGORY_DISPLAY_NAMES[normalizedCategory]
        : "Services";

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchServices() {
            if (!normalizedCategory) return;

            try {
                const allServices = await serviceService.getServices();
                // Filter services by normalized category
                const filtered = allServices.filter(
                    (service) => service.category === normalizedCategory
                );
                setServices(filtered);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchServices();
    }, [normalizedCategory]);

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#A1F6FB] via-[#DBFDFC] to-slate-50 pointer-events-none" />

            {/* Header */}
            <div className="bg-transparent px-4 py-4 sticky top-0 z-30 backdrop-blur-sm">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:bg-white/50"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-extrabold text-slate-900">{displayCategory} Services</h1>
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6 relative z-10">
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
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {services.map((service) => (
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
                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wrench className="w-8 h-8 text-blue-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                            No services found
                        </h3>
                        <p className="text-slate-500 text-sm max-w-[200px] mx-auto leading-relaxed">
                            We haven't added any {displayCategory.toLowerCase()} services yet.
                        </p>
                        <Button
                            onClick={() => router.push('/')}
                            className="mt-6 bg-blue-600 hover:bg-blue-700 font-bold rounded-full"
                        >
                            Browse all categories
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
