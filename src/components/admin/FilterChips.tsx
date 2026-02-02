"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface FilterChip {
    id: string;
    label: string;
    count?: number;
}

interface FilterChipsProps {
    filters: FilterChip[];
    activeFilter?: string;
    onFilterChange: (filterId: string) => void;
    showClearAll?: boolean;
    onClearAll?: () => void;
    className?: string;
}

export function FilterChips({
    filters,
    activeFilter,
    onFilterChange,
    showClearAll = true,
    onClearAll,
    className
}: FilterChipsProps) {
    return (
        <div className={cn("w-full", className)}>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex items-center gap-2 pb-2">
                    {filters.map((filter) => {
                        const isActive = activeFilter === filter.id;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => onFilterChange(filter.id)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap touch-target",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                <span>{filter.label}</span>
                                {filter.count !== undefined && (
                                    <Badge
                                        variant={isActive ? "secondary" : "outline"}
                                        className={cn(
                                            "h-5 min-w-[20px] px-1.5 text-[10px] font-bold",
                                            isActive
                                                ? "bg-white/20 text-white border-white/20"
                                                : "bg-white text-slate-600"
                                        )}
                                    >
                                        {filter.count}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}

                    {showClearAll && activeFilter && onClearAll && (
                        <button
                            onClick={onClearAll}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 whitespace-nowrap touch-target"
                        >
                            <X className="h-3 w-3" />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
