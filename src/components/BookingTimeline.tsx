"use client";

import { BookingStatus } from "@/types";
import { Clock, CheckCircle2, Loader2, XCircle, Truck } from "lucide-react";

interface BookingTimelineProps {
    status: BookingStatus;
    createdAt?: Date;
}

const statusConfig = {
    pending: {
        label: "Pending",
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        description: "Waiting for partner acceptance"
    },
    accepted: {
        label: "Accepted",
        icon: CheckCircle2,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        description: "Partner confirmed the booking"
    },
    in_progress: {
        label: "In Progress",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        description: "Partner is on the way / working"
    },
    completed: {
        label: "Completed",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "Service completed successfully"
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        description: "Booking was cancelled"
    }
};

const statusOrder: BookingStatus[] = ['pending', 'accepted', 'in_progress', 'completed'];

export function BookingTimeline({ status, createdAt }: BookingTimelineProps) {
    const currentConfig = statusConfig[status];
    const CurrentIcon = currentConfig.icon;

    const currentIndex = statusOrder.indexOf(status);
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
        return (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${currentConfig.bgColor} flex items-center justify-center`}>
                        <CurrentIcon className={`w-5 h-5 ${currentConfig.color}`} />
                    </div>
                    <div>
                        <h4 className={`font-extrabold ${currentConfig.color}`}>
                            {currentConfig.label}
                        </h4>
                        <p className="text-xs text-slate-600">
                            {currentConfig.description}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {statusOrder.map((item, index) => {
                const config = statusConfig[item];
                const Icon = config.icon;
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;
                const isPending = index > currentIndex;

                return (
                    <div key={item} className="flex items-center gap-3">
                        {/* Timeline Line */}
                        <div className="flex flex-col items-center">
                            {/* Icon Circle */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive
                                        ? `${config.bgColor} ring-4 ring-opacity-30 ${config.color.replace('text-', 'ring-')}`
                                        : isCompleted
                                            ? "bg-green-100"
                                            : "bg-slate-100"
                                    }`}
                            >
                                {isActive ? (
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                ) : isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Icon className="w-5 h-5 text-slate-400" />
                                )}
                            </div>

                            {/* Connecting Line */}
                            {index < statusOrder.length - 1 && (
                                <div
                                    className={`w-0.5 h-8 ${isCompleted ? "bg-green-300" : "bg-slate-200"
                                        }`}
                                />
                            )}
                        </div>

                        {/* Status Info */}
                        <div className="flex-1 pb-8">
                            <h4
                                className={`font-bold ${isActive
                                        ? config.color
                                        : isCompleted
                                            ? "text-green-600"
                                            : "text-slate-400"
                                    }`}
                            >
                                {config.label}
                            </h4>
                            <p
                                className={`text-xs ${isActive || isCompleted ? "text-slate-600" : "text-slate-400"
                                    }`}
                            >
                                {config.description}
                            </p>
                            {isActive && (
                                <div className="flex items-center gap-1 mt-1 text-xs font-bold text-blue-600">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Current Status</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
