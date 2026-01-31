"use client";

import { Partner } from "@/types";
import { Star, ShieldCheck, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PartnerCardProps {
    partner: Partner;
    basePrice: number;
    isSelected?: boolean;
    onSelect: () => void;
}

export function PartnerCard({ partner, basePrice, isSelected, onSelect }: PartnerCardProps) {
    const finalPrice = Math.round(basePrice * partner.priceMultiplier);
    const priceVariance = Math.round((partner.priceMultiplier - 1) * 100);

    return (
        <Card
            className={`group cursor-pointer transition-all duration-200 ${isSelected
                    ? "border-2 border-blue-600 bg-blue-50/50 ring-4 ring-blue-100 shadow-lg"
                    : "border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-slate-100"
                }`}
            onClick={onSelect}
        >
            <div className="p-4 space-y-3">
                {/* Partner Header */}
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-xl overflow-hidden border-2 border-white shadow-md">
                            {partner.photoURL ? (
                                <img
                                    src={partner.photoURL}
                                    alt={partner.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                partner.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        {partner.availability === 'online' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                    </div>

                    {/* Partner Info */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-extrabold text-slate-900">{partner.name}</h4>
                            {partner.rating > 0 && (
                                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                    <Star className="w-4 h-4 fill-amber-500" />
                                    <span>{partner.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                            {partner.bio}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1 text-slate-500 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                <span>{partner.completedJobs} jobs</span>
                            </div>
                            {partner.reviewCount > 0 && (
                                <div className="flex items-center gap-1 text-slate-500 font-medium">
                                    <span>•</span>
                                    <span>{partner.reviewCount} reviews</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className={`flex items-center justify-between p-3 rounded-xl ${isSelected ? "bg-blue-100/50" : "bg-slate-50"
                    } border border-slate-200`}>
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                            Service Price
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-extrabold text-slate-900">₹{finalPrice}</span>
                            {priceVariance !== 0 && (
                                <span className={`text-xs font-bold ${priceVariance > 0 ? "text-orange-600" : "text-green-600"
                                    }`}>
                                    {priceVariance > 0 ? "+" : ""}{priceVariance}%
                                </span>
                            )}
                        </div>
                    </div>

                    {partner.availability === 'online' ? (
                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Available Now
                        </div>
                    ) : (
                        <div className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                            Offline
                        </div>
                    )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 animate-in fade-in slide-in-from-top-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span>Selected</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
