"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    loading?: boolean;
    className?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    color,
    trend,
    loading,
    className
}: StatCardProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const [mounted, setMounted] = useState(false);
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;

    // Animation mount effect
    useEffect(() => {
        setMounted(true);
    }, []);

    // Animated counter effect
    useEffect(() => {
        if (loading || isNaN(numericValue)) return;

        let start = 0;
        const end = numericValue;
        const duration = 1200; // 1.2 seconds for smoother animation
        const increment = end / (duration / 16); // 60fps

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [numericValue, loading]);

    const formattedValue = typeof value === 'string' && value.includes('₹')
        ? `₹${displayValue.toLocaleString()}`
        : displayValue.toLocaleString();

    return (
        <Card
            className={cn(
                "relative border-none shadow-md hover:shadow-2xl transition-all duration-500 group overflow-hidden touch-target",
                "bg-white/95 backdrop-blur-md",
                mounted && "animate-in fade-in slide-in-from-bottom-4 duration-700",
                className
            )}
        >
            {/* Glassmorphism gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />

            {/* Animated background on hover */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                color
            )} />

            <CardHeader className="relative flex flex-row items-center justify-between pb-2 sm:pb-3 space-y-0 px-4 sm:px-6 pt-4 sm:pt-5">
                <CardTitle className="text-[11px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider leading-tight">
                    {title}
                </CardTitle>
                <div className={cn(
                    "p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br shadow-lg",
                    "group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                    "ring-4 ring-white/50",
                    color
                )}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-md" />
                </div>
            </CardHeader>

            <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-5">
                <div className="space-y-1 sm:space-y-2">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-8 sm:h-10 w-28 sm:w-32 rounded-lg" />
                            <Skeleton className="h-3 w-20 rounded" />
                        </div>
                    ) : (
                        <>
                            <div className={cn(
                                "text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900",
                                "bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent",
                                "transition-all duration-300 group-hover:scale-105"
                            )}>
                                {typeof value === 'string' && value.includes('₹') ? formattedValue : value}
                            </div>
                            {trend && (
                                <div className="flex items-center gap-1.5 text-xs">
                                    <div className={cn(
                                        "flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full",
                                        trend.isPositive
                                            ? "bg-green-50 text-green-700"
                                            : "bg-red-50 text-red-700"
                                    )}>
                                        <span className="text-sm">
                                            {trend.isPositive ? "↑" : "↓"}
                                        </span>
                                        <span>{Math.abs(trend.value)}%</span>
                                    </div>
                                    <span className="text-slate-400 font-medium">vs last month</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardContent>

            {/* Bottom accent line */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                color
            )} />
        </Card>
    );
}
