"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Booking, UserProfile } from "@/types";
import { format } from "date-fns";
import { Calendar, Clock, CreditCard, Variable, MapPin, Phone, User, Wrench, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateDistance, formatDistance } from "@/utils/distance.util";

interface BookingDetailsModalProps {
    booking: Booking | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partnerLocation?: UserProfile['location'];
}

export function BookingDetailsModal({ booking, open, onOpenChange, partnerLocation }: BookingDetailsModalProps) {
    if (!booking) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (booking?.location?.geoPoint && partnerLocation) {
        console.log("Distance Calculation Debug:");
        console.log("Partner Location:", partnerLocation);
        console.log("Booking Location:", booking.location.geoPoint);
    }

    const distance = (booking.location?.geoPoint && partnerLocation)
        ? calculateDistance(
            partnerLocation.lat,
            partnerLocation.lng,
            booking.location.geoPoint.latitude,
            booking.location.geoPoint.longitude
        )
        : null;

    console.log("Calculated Distance:", distance);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Booking Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase border ${getStatusColor(booking.status)}`}>
                            {booking.status}
                        </span>
                        <span className="text-sm text-slate-500">
                            ID: {booking.id.slice(-8)}
                        </span>
                    </div>

                    {/* Service Information */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                <Wrench className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900">{booking.serviceName}</h3>
                                <p className="text-sm text-slate-600 mt-1">Service ID: {booking.serviceId.slice(-8)}</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-2xl font-bold text-blue-600">₹{booking.servicePrice}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${booking.paymentStatus === 'paid'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {booking.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Customer Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <User className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Customer Name</p>
                                    <p className="font-medium text-slate-900">{booking.customerName || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="h-5 w-5 flex items-center justify-center text-slate-400 font-mono text-xs border rounded">ID</div>
                                <div>
                                    <p className="text-xs text-slate-500">Customer ID</p>
                                    <p className="font-medium text-slate-900">{booking.customerId.slice(-8)}</p>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Problem Description */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Problem Description</h4>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex gap-3">
                                <FileText className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-slate-700 text-sm leading-relaxed">
                                        {booking.description}
                                    </p>
                                    {booking.notes && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                                            <p className="text-slate-600 text-sm">{booking.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Uploaded Images */}
                    {booking.images && booking.images.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-900">Uploaded Images ({booking.images.length})</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {booking.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-100">
                                        <img
                                            src={img}
                                            alt={`Issue photo ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <a
                                            href={img}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <span className="text-white text-xs font-bold px-3 py-1.5 border border-white/30 rounded-full bg-white/10 backdrop-blur-sm">
                                                View Full
                                            </span>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Booking Details */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">Booking Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Scheduled Time</p>
                                    <p className="font-medium text-slate-900">
                                        {format(booking.scheduledTime.toDate(), "MMM dd, yyyy hh:mm a")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Payment Method</p>
                                    <p className="font-medium text-slate-900">{booking.paymentMethod}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <MapPin className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500">Created</p>
                                    <p className="font-medium text-slate-900">
                                        {booking.createdAt ? format(booking.createdAt.toDate(), "MMM dd, hh:mm a") : "Just now"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">Service Location</h4>
                            {distance !== null && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                    {formatDistance(distance)} away
                                </span>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-slate-700 font-medium">
                                        {booking.location.street}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        {booking.location.city}, {booking.location.zipCode}
                                    </p>
                                    {booking.location.geoPoint && (
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&origin=${partnerLocation?.lat},${partnerLocation?.lng}&destination=${booking.location.geoPoint.latitude},${booking.location.geoPoint.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 mt-3 hover:underline"
                                        >
                                            Get Directions
                                            <MapPin className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warranty Info */}
                    {booking.warrantyValidUntil && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-900">
                                Warranty valid until: {format(booking.warrantyValidUntil.toDate(), "MMM dd, yyyy")}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog >
    );
}
