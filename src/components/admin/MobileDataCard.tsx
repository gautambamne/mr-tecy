"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronRight, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileDataCardProps {
    title: string;
    subtitle?: string;
    status?: {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    };
    metadata?: Array<{
        label: string;
        value: string | number;
    }>;
    actions?: Array<{
        label: string;
        icon?: ReactNode;
        onClick: () => void;
        variant?: "default" | "destructive" | "outline" | "ghost";
    }>;
    onTap?: () => void;
    image?: string;
    className?: string;
}

export function MobileDataCard({
    title,
    subtitle,
    status,
    metadata,
    actions,
    onTap,
    image,
    className
}: MobileDataCardProps) {
    return (
        <Card
            className={cn(
                "border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white overflow-hidden touch-target",
                onTap && "cursor-pointer active:scale-[0.98]",
                className
            )}
            onClick={onTap}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {image && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                <img
                                    src={image}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm truncate">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {status && (
                            <Badge
                                variant={status.variant}
                                className="text-[10px] px-2 py-0.5 font-bold uppercase"
                            >
                                {status.label}
                            </Badge>
                        )}
                        {actions && actions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {actions.map((action, idx) => (
                                        <DropdownMenuItem
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                action.onClick();
                                            }}
                                        >
                                            {action.icon && (
                                                <span className="mr-2">{action.icon}</span>
                                            )}
                                            {action.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>

            {metadata && metadata.length > 0 && (
                <>
                    <Separator />
                    <CardContent className="pt-3">
                        <div className="grid grid-cols-2 gap-3">
                            {metadata.map((item, idx) => (
                                <div key={idx} className="min-w-0">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                                        {item.label}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5 break-words overflow-wrap-anywhere">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </>
            )}

            {onTap && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
            )}
        </Card>
    );
}
