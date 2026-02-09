"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/services/service.service";
import { Service, ServiceCategory } from "@/types";
import { LocationMap } from "@/components/LocationMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    ChevronLeft,
    Loader2,
    Plus,
    X,
    User,
    MapPin,
    Wrench,
    Package,
    TrendingUp,
    Home as HomeIcon,
    Briefcase,
    MapPinned,
    Check,
} from "lucide-react";
import { SERVICE_CATEGORIES, CATEGORY_DISPLAY_NAMES } from "@/constants/categories";
import { cn } from "@/lib/utils";
import { Address } from "@/types";
import { GeoPoint } from "firebase/firestore";

interface SelectedService extends Service {
    quantity: number;
}

type AddressLabel = "home" | "work" | "other";

// Category image mapping
const getCategoryImage = (category: ServiceCategory) => {
    switch (category) {
        case "car":
            return "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=400&auto=format&fit=crop&q=80";
        case "bike":
            return "/images/categories/bike.png";
        case "electrician":
            return "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&auto=format&fit=crop&q=80";
        case "other":
            return "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&auto=format&fit=crop&q=80"; // Generic maintenance image
        default:
            return "/images/categories/for-you.png";
    }
};

function BookingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile, loading: authLoading } = useAuth();

    // Form states
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
    const [location, setLocation] = useState({ lat: 20.5937, lng: 78.9629 });
    const [selfDropMode, setSelfDropMode] = useState(false);
    const [addressLabel, setAddressLabel] = useState<AddressLabel>("home");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Load services
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        fetchServices();
    }, [user, authLoading]);

    // Set initial location from localStorage (selected from dialog) or user's first address
    useEffect(() => {
        // First, try to load from localStorage (location selected from dialog)
        const savedLocation = localStorage.getItem("selectedLocation");
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                if (parsed.lat && parsed.lng) {
                    setLocation({
                        lat: parsed.lat,
                        lng: parsed.lng,
                    });
                    return; // Exit early if we found a saved location
                }
            } catch (error) {
                console.error("Error parsing saved location:", error);
            }
        }

        // Fallback to user's first address if no localStorage location
        if (profile?.addresses && profile.addresses.length > 0) {
            const firstAddress = profile.addresses[0];
            if (firstAddress.geoPoint) {
                setLocation({
                    lat: firstAddress.geoPoint.latitude,
                    lng: firstAddress.geoPoint.longitude,
                });
            }
        }
    }, [profile]);

    const fetchServices = async () => {
        try {
            const data = await serviceService.getServices();
            setServices(data);
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle pre-selected service from URL
    useEffect(() => {
        const serviceId = searchParams.get("serviceId");
        if (!serviceId || services.length === 0) return;

        const serviceToSelect = services.find((s) => s.id === serviceId);
        if (serviceToSelect) {
            // check if service category matches current selected category (or if none selected)
            if (!selectedCategory || selectedCategory !== serviceToSelect.category) {
                setSelectedCategory(serviceToSelect.category as ServiceCategory);
            }

            // Check if already selected
            const isAlreadySelected = selectedServices.some((s) => s.id === serviceToSelect.id);
            if (!isAlreadySelected) {
                setSelectedServices((prev) => [...prev, { ...serviceToSelect, quantity: 1 }]);
            }
        }
    }, [searchParams, services, selectedCategory]);

    // Filter services by selected category
    const filteredServices = selectedCategory
        ? services.filter((s) => s.category === selectedCategory)
        : services;

    // Handle category selection
    const handleCategorySelect = (category: ServiceCategory) => {
        setSelectedCategory(category);
    };

    // Handle service addition
    const handleAddService = (service: Service) => {
        const existing = selectedServices.find((s) => s.id === service.id);
        if (existing) {
            // Increase quantity
            setSelectedServices(
                selectedServices.map((s) =>
                    s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s
                )
            );
        } else {
            // Add new service
            setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
        }
    };

    // Handle service removal
    const handleRemoveService = (serviceId: string) => {
        setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
    };

    // Handle decrease quantity
    const handleDecreaseQuantity = (serviceId: string) => {
        const existing = selectedServices.find((s) => s.id === serviceId);
        if (existing && existing.quantity > 1) {
            setSelectedServices(
                selectedServices.map((s) =>
                    s.id === serviceId ? { ...s, quantity: s.quantity - 1 } : s
                )
            );
        } else {
            handleRemoveService(serviceId);
        }
    };

    // Calculate total amount
    const totalAmount = selectedServices.reduce(
        (sum, s) => sum + s.price * s.quantity,
        0
    );

    // Handle form submission
    const handleContinue = () => {
        if (selectedServices.length === 0) {
            alert("Please add at least one service before proceeding");
            return;
        }

        // Convert location to Address format
        const address: Partial<Address> = {
            label: addressLabel.charAt(0).toUpperCase() + addressLabel.slice(1),
            street: `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
            city: "Selected Location",
            zipCode: "000000",
            geoPoint: new GeoPoint(location.lat, location.lng),
        };

        // Store booking data in session storage
        const bookingData = {
            services: selectedServices,
            location,
            address,
            selfDropMode,
            totalAmount,
            category: selectedCategory,
            customerName: profile?.displayName || user?.displayName || "",
        };

        sessionStorage.setItem("myBookingData", JSON.stringify(bookingData));

        // Navigate to partner selection
        router.push("/booking/partner-selection");
    };

    // Show loading while auth is initializing
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!user) {
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
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="hover:bg-slate-100 rounded-xl"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    My Booking
                </h1>
            </div>

            <main className="relative z-10 max-w-md mx-auto p-4 sm:p-6 space-y-6 pt-6">
                {/* Name Field (Read-only) */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        Customer Name
                    </p>
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
                        <p className="text-sm font-bold text-slate-700">
                            {profile?.displayName || user.displayName || "User"}
                        </p>
                    </div>
                </div>

                {/* Location Map */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Service Location
                    </p>
                    <LocationMap
                        initialPosition={location}
                        onLocationSelect={setLocation}
                        height="280px"
                    />
                </div>

                {/* Service Category Selection */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Service Category *
                    </p>
                    <div className="grid grid-cols-4 gap-3 sm:gap-4">
                        {SERVICE_CATEGORIES.map((category) => {
                            const imageUrl = getCategoryImage(category);
                            const isSelected = selectedCategory === category;
                            const isDisabled = selectedServices.length > 0 && !isSelected;

                            return (
                                <button
                                    key={category}
                                    onClick={() => handleCategorySelect(category)}
                                    className={cn(
                                        "group flex flex-col items-center gap-2 transition-all duration-300",
                                        isDisabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
                                    )}
                                    disabled={isDisabled}
                                >
                                    <div className={cn(
                                        "relative w-full aspect-square rounded-2xl overflow-hidden shadow-md transition-all duration-300",
                                        isSelected
                                            ? "ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-blue-200/50"
                                            : "ring-1 ring-slate-100 hover:ring-blue-300 hover:scale-105"
                                    )}>
                                        <img
                                            src={imageUrl}
                                            alt={CATEGORY_DISPLAY_NAMES[category]}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className={cn(
                                            "absolute inset-0 transition-opacity duration-300",
                                            isSelected ? "bg-black/20" : "bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40"
                                        )} />

                                        {/* Selection Checkmark */}
                                        {isSelected && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg transform scale-100 transition-transform">
                                                    <Check className="w-4 h-4 stroke-[3px]" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] sm:text-xs font-bold text-center capitalize transition-colors",
                                        isSelected ? "text-blue-700" : "text-slate-600 group-hover:text-blue-600"
                                    )}>
                                        {CATEGORY_DISPLAY_NAMES[category]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {selectedServices.length > 0 && (
                        <p className="text-[10px] text-amber-600 px-1 flex items-center justify-center gap-1.5 font-medium bg-amber-50 py-2 rounded-lg border border-amber-100">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                            Category locked. Remove services to change.
                        </p>
                    )}
                </div>

                {/* Service Selection */}
                {selectedCategory && (
                    <div className="space-y-2.5 animate-in slide-in-from-top-4 duration-300">
                        <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                            Available Services
                        </p>
                        <div className="space-y-2">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => {
                                    const isSelected = selectedServices.some((s) => s.id === service.id);
                                    return (
                                        <div
                                            key={service.id}
                                            className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-blue-300 transition-all"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 text-sm">{service.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
                                                    <p className="text-sm font-bold text-blue-600 mt-2">₹{service.price}</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAddService(service)}
                                                    size="sm"
                                                    className={cn(
                                                        "rounded-full font-bold shadow-sm",
                                                        isSelected
                                                            ? "bg-green-600 hover:bg-green-700"
                                                            : "bg-blue-600 hover:bg-blue-700"
                                                    )}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-slate-500 text-sm py-8">
                                    No services available in this category
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Added Services */}
                {selectedServices.length > 0 && (
                    <div className="space-y-2.5">
                        <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            Added Services ({selectedServices.length})
                        </p>
                        <div className="space-y-2">
                            {selectedServices.map((service) => (
                                <div
                                    key={service.id}
                                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 text-sm">{service.name}</h4>
                                            <p className="text-xs text-blue-600 font-bold mt-1">
                                                ₹{service.price} × {service.quantity} = ₹{service.price * service.quantity}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => handleRemoveService(service.id)}
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 rounded-full hover:bg-red-100 text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Address Label Selection */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Save Location As
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setAddressLabel("home")}
                            className={cn(
                                "p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5",
                                addressLabel === "home"
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-slate-200 bg-white hover:border-blue-300"
                            )}
                        >
                            <HomeIcon
                                className={cn(
                                    "w-5 h-5",
                                    addressLabel === "home" ? "text-blue-600" : "text-slate-500"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-xs font-bold",
                                    addressLabel === "home" ? "text-blue-900" : "text-slate-600"
                                )}
                            >
                                Home
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAddressLabel("work")}
                            className={cn(
                                "p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5",
                                addressLabel === "work"
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-slate-200 bg-white hover:border-blue-300"
                            )}
                        >
                            <Briefcase
                                className={cn(
                                    "w-5 h-5",
                                    addressLabel === "work" ? "text-blue-600" : "text-slate-500"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-xs font-bold",
                                    addressLabel === "work" ? "text-blue-900" : "text-slate-600"
                                )}
                            >
                                Work
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAddressLabel("other")}
                            className={cn(
                                "p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5",
                                addressLabel === "other"
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-slate-200 bg-white hover:border-blue-300"
                            )}
                        >
                            <MapPinned
                                className={cn(
                                    "w-5 h-5",
                                    addressLabel === "other" ? "text-blue-600" : "text-slate-500"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-xs font-bold",
                                    addressLabel === "other" ? "text-blue-900" : "text-slate-600"
                                )}
                            >
                                Other
                            </span>
                        </button>
                    </div>
                </div>

                {/* Self Drop Mode */}
                <div className="space-y-2.5">
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase px-1">
                        Self Drop Mode
                    </p>
                    <button
                        type="button"
                        onClick={() => setSelfDropMode(!selfDropMode)}
                        className={cn(
                            "w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                            selfDropMode
                                ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md shadow-blue-200/50"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    {selfDropMode ? "Self Drop Enabled" : "Self Drop Disabled"}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selfDropMode
                                        ? "You will drop off your vehicle/item at the service center"
                                        : "Service will be performed at your location"}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    "w-14 h-8 rounded-full p-1 transition-all duration-200",
                                    selfDropMode ? "bg-blue-600" : "bg-slate-300"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full bg-white transition-transform duration-200",
                                        selfDropMode ? "translate-x-6" : "translate-x-0"
                                    )}
                                />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Total Summary */}
                {selectedServices.length > 0 && (
                    <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-white to-blue-50/50">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 font-semibold">Subtotal</span>
                                <span className="font-bold text-slate-900">₹{totalAmount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 font-semibold">Services</span>
                                <span className="font-bold text-slate-900">{selectedServices.length}</span>
                            </div>
                            <div className="pt-3 border-t-2 border-blue-100 flex items-center justify-between">
                                <span className="text-base font-extrabold text-slate-900">Total Amount</span>
                                <span className="text-2xl font-black text-blue-600">₹{totalAmount}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] z-50">
                <div className="max-w-md mx-auto">
                    <Button
                        onClick={handleContinue}
                        disabled={selectedServices.length === 0 || submitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 sm:h-14 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                Continue to Booking
                                <TrendingUp className="w-4 h-4" />
                            </span>
                        )}
                    </Button>
                    {selectedServices.length === 0 && (
                        <p className="text-xs text-center text-slate-500 mt-3">
                            Please add at least one service to continue
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400">Loading booking...</p>
                    </div>
                </div>
            }
        >
            <BookingPageContent />
        </Suspense>
    );
}
