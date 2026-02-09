"use client";

import { useState, useEffect } from "react";
import { LocationMap } from "./LocationMap";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "./ui/dialog";
import { MapPin, Loader2, Check, X } from "lucide-react";

interface LocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LocationDialog({ open, onOpenChange }: LocationDialogProps) {
    // Default to India center, will be updated from localStorage in useEffect
    const [selectedLocation, setSelectedLocation] = useState({
        lat: 20.5937,
        lng: 78.9629,
    });

    const [districtName, setDistrictName] = useState("");
    const [city, setCity] = useState("");
    const [loading, setLoading] = useState(false);

    // Load from localStorage on client-side only
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("selectedLocation");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.lat && parsed.lng) {
                        setSelectedLocation({ lat: parsed.lat, lng: parsed.lng });
                        if (parsed.districtName) setDistrictName(parsed.districtName);
                        if (parsed.city) setCity(parsed.city);
                    }
                } catch (error) {
                    console.error("Error parsing saved location:", error);
                }
            }
        }
    }, []);

    const handleLocationSelect = (coords: { lat: number; lng: number }) => {
        setSelectedLocation(coords);
        fetchDistrictName(coords.lat, coords.lng);
    };

    const fetchDistrictName = async (lat: number, lng: number) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        "User-Agent": "MrTecy/1.0",
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                const address = data.address || {};

                const district =
                    address.suburb ||
                    address.neighbourhood ||
                    address.city_district ||
                    address.quarter ||
                    address.village ||
                    address.town ||
                    "Unknown Area";

                const cityName = address.city || address.town || address.village || address.county || "";

                setDistrictName(district);
                setCity(cityName);
            }
        } catch (error) {
            console.error("Error fetching location name:", error);
            setDistrictName("Unknown Area");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        // Save to localStorage (only on client)
        if (typeof window !== "undefined") {
            const locationData = {
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                districtName,
                city,
            };
            localStorage.setItem("selectedLocation", JSON.stringify(locationData));
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 gap-0 max-h-[85vh] flex flex-col">
                {/* Hidden but accessible header */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Select Your Location</DialogTitle>
                    <DialogDescription>
                        Click or drag the marker on the map to select your location
                    </DialogDescription>
                </DialogHeader>

                {/* Visual Header - Compact */}
                <div className="px-5 pt-5 pb-3 border-b border-slate-200">
                    <h2 className="text-lg font-black text-slate-900" aria-hidden="true">
                        Select Your Location
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5" aria-hidden="true">
                        Click or drag the marker on map
                    </p>
                </div>

                {/* Content - No scroll needed */}
                <div className="flex-1 flex flex-col">
                    {/* Compact Location Display */}
                    <div className="px-5 pt-3 pb-2">
                        <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-2.5 border border-blue-200">
                            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                {loading ? (
                                    <div className="flex items-center gap-1.5">
                                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                        <span className="text-xs text-slate-600 font-medium">Loading...</span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                            {districtName || "Select a location"}
                                        </p>
                                        {city && (
                                            <p className="text-[10px] text-slate-500 truncate">{city}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Map - Optimized Height */}
                    <div className="px-5 pb-3 flex-1">
                        <LocationMap
                            initialPosition={selectedLocation}
                            onLocationSelect={handleLocationSelect}
                            height="320px"
                        />
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="border-t border-slate-200 px-5 py-3 bg-slate-50">
                    <div className="flex gap-2">
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="outline"
                            className="flex-1 h-10 rounded-xl font-bold border-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading || !districtName}
                            className="flex-1 h-10 rounded-xl font-bold bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-1.5" />
                                    Confirm
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

