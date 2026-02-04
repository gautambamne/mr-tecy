"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/services/service.service";
import { Service, Address } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { ChevronLeft, Loader2, MapPin, FileText, ImageIcon } from "lucide-react";
import Link from "next/link";

export default function ServiceDetailsPage() {
    const { serviceId } = useParams();
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        // Redirect to login if not authenticated
        if (!user) {
            router.push("/login");
            return;
        }

        if (serviceId) {
            fetchService();
        }

        // Set default address if available
        if (profile?.addresses && profile.addresses.length > 0) {
            setSelectedAddress(profile.addresses[0]);
        }
    }, [serviceId, user, profile, authLoading]);

    const fetchService = async () => {
        try {
            const data = await serviceService.getServiceById(serviceId as string);
            setService(data);
        } catch (error) {
            console.error("Error fetching service:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (!description.trim()) {
            alert("Please describe your issue");
            return;
        }

        if (!selectedAddress) {
            alert("Please select an address");
            return;
        }

        // Store data in sessionStorage to pass to next page
        const bookingData = {
            serviceId: service?.id,
            description,
            notes,
            location: selectedAddress,
            // Images will be uploaded after partner selection during final booking
        };

        sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
        sessionStorage.setItem("bookingImages", JSON.stringify(selectedImages.length)); // Just store count for now

        // Navigate to partner selection
        router.push(`/partners/${service?.id}`);
    };

    // Show loading while auth is initializing or service is loading
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Redirect unauthenticated users - don't show any content
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Only show "not found" after confirming user is authenticated
    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <p className="text-slate-600 font-medium">Service not found</p>
                    <Link href="/">
                        <Button className="mt-4">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <div className="bg-white border-b px-4 py-4 sticky top-0 z-30 flex items-center gap-4 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-extrabold text-slate-900">Service Details</h1>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-6 pt-6">
                {/* Service Header */}
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10 rounded-full" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-extrabold mb-1">{service.name}</h2>
                                <p className="text-blue-100 text-sm font-medium opacity-90">
                                    {service.category}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-extrabold">₹{service.price}</span>
                                <p className="text-blue-100 text-xs">Base Price</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address Selection */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Service Location
                    </label>
                    {profile?.addresses && profile.addresses.length > 0 ? (
                        <div className="space-y-2">
                            {profile.addresses.map((address) => (
                                <div
                                    key={address.id}
                                    onClick={() => setSelectedAddress(address)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress?.id === address.id
                                        ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100"
                                        : "border-slate-200 bg-white hover:border-blue-300"
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900">{address.label}</p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {address.street}, {address.city}, {address.zipCode}
                                            </p>
                                        </div>
                                        {selectedAddress?.id === address.id && (
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800 font-medium">
                                No addresses found. Please add an address in your profile.
                            </p>
                        </div>
                    )}
                </div>

                {/* Issue Description */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Describe Your Issue *
                    </label>
                    <Textarea
                        placeholder="Please describe the problem or service you need in detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="resize-none rounded-xl border-2 border-slate-200 focus:border-blue-400"
                    />
                    <p className="text-xs text-slate-500">
                        Provide as much detail as possible to help the service partner prepare
                    </p>
                </div>

                {/* Special Instructions */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">
                        Special Instructions (Optional)
                    </label>
                    <Textarea
                        placeholder="Any special instructions or requests..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="resize-none rounded-xl border-2 border-slate-200 focus:border-blue-400"
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        Upload Images (Optional)
                    </label>
                    <ImageUpload
                        maxImages={5}
                        onImagesChange={setSelectedImages}
                    />
                    <p className="text-xs text-slate-500">
                        Photos help partners understand your issue better
                    </p>
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto">
                    <Button
                        onClick={handleContinue}
                        disabled={!description.trim() || !selectedAddress}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Find Available Partners →
                    </Button>
                </div>
            </div>
        </div>
    );
}
