"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { GeoPoint } from "firebase/firestore";

// Dynamic import to avoid SSR issues with Leaflet
let L: any;
if (typeof window !== "undefined") {
    import("leaflet").then((leaflet) => {
        L = leaflet.default;
    });
}

export interface LocationMapProps {
    initialPosition?: { lat: number; lng: number };
    onLocationSelect: (position: { lat: number; lng: number }) => void;
    height?: string;
    className?: string;
}

export function LocationMap({
    initialPosition = { lat: 20.5937, lng: 78.9629 }, // Center of India as default
    onLocationSelect,
    height = "300px",
    className = "",
}: LocationMapProps) {
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [map, setMap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(initialPosition);

    // Use a ref to store the map instance for cleanup access
    const mapInstanceRef = useRef<any>(null);

    // Initialize map
    useEffect(() => {
        if (typeof window === "undefined" || !L) return;

        // Wait a bit for Leaflet to be fully loaded
        const timer = setTimeout(() => {
            if (!mapRef.current || mapInstanceRef.current) return;

            try {
                // Create map instance
                const mapInstance = L.map(mapRef.current, {
                    zoomControl: true,
                    scrollWheelZoom: true,
                    dragging: true,
                    touchZoom: true,
                }).setView([initialPosition.lat, initialPosition.lng], 13);

                // Add OpenStreetMap tiles
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(mapInstance);

                // Add draggable marker
                const marker = L.marker([initialPosition.lat, initialPosition.lng], {
                    draggable: true,
                    title: "Drag me to your location",
                    autoPan: true,
                    icon: L.icon({
                        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41],
                    }),
                }).addTo(mapInstance);

                // Handle marker drag
                marker.on("dragend", (e: any) => {
                    const { lat, lng } = e.target.getLatLng();
                    setCurrentPosition({ lat, lng });
                    onLocationSelect({ lat, lng });
                });

                // Handle map click to place marker
                mapInstance.on("click", (e: any) => {
                    const { lat, lng } = e.latlng;
                    marker.setLatLng([lat, lng]);
                    setCurrentPosition({ lat, lng });
                    onLocationSelect({ lat, lng });
                });

                markerRef.current = marker;
                mapInstanceRef.current = mapInstance;
                setMap(mapInstance);
                setLoading(false);
            } catch (error) {
                console.error("Error initializing map:", error);
                setLoading(false);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                setMap(null);
            }
        };
    }, []);

    // Update marker position when initialPosition changes
    useEffect(() => {
        if (map && markerRef.current) {
            markerRef.current.setLatLng([initialPosition.lat, initialPosition.lng]);
            map.setView([initialPosition.lat, initialPosition.lng], 13);
            setCurrentPosition(initialPosition);
        }
    }, [initialPosition, map]);

    // Get current location using browser geolocation
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos = { lat: latitude, lng: longitude };

                setCurrentPosition(newPos);
                onLocationSelect(newPos);

                if (map && markerRef.current) {
                    markerRef.current.setLatLng([latitude, longitude]);
                    map.setView([latitude, longitude], 15);
                }

                setGettingLocation(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Unable to retrieve your location. Please check your browser settings.");
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md">
                {loading && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10"
                        style={{ height }}
                    >
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-semibold">Loading map...</p>
                        </div>
                    </div>
                )}
                <div ref={mapRef} style={{ height, width: "100%" }} />
            </div>

            {/* Location Controls */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-bold shadow-sm"
                >
                    {gettingLocation ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting Location...
                        </>
                    ) : (
                        <>
                            <Navigation className="w-4 h-4 mr-2" />
                            Use Current Location
                        </>
                    )}
                </Button>

                {/* Coordinates Display */}
                <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-mono font-semibold">
                            {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-slate-500 px-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full" />
                Click on the map or drag the marker to set your location
            </p>
        </div>
    );
}
