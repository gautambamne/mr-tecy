"use client";

import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/booking.service";
import { Booking, BookingStatus } from "@/types";
import { useState, useEffect } from "react";
import { Loader2, Eye, Clock, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { getStatusDropdownOptions, isStatusLocked } from "@/lib/booking-status";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { BookingDetailsModal } from "@/components/admin/BookingDetailsModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerBookingsPage() {
    const { profile } = useAuth();
    const toast = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!profile?.uid) return;

        setLoading(true);

        const unsubscribe = bookingService.subscribeToPartnerBookings(
            profile.uid,
            (data) => {
                setBookings(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching partner bookings:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [profile?.uid]);

    const filteredBookings = bookings.filter((booking) => {
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        return matchesStatus;
    });

    const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
        setUpdatingStatus(bookingId);
        try {
            await bookingService.updateBookingStatus(bookingId, newStatus);
            toast.success(
                "Status Updated",
                `Booking status updated to ${newStatus.replace('_', ' ')}`
            );
        } catch (error: any) {
            console.error("Error updating status:", error);

            let errorMessage = "Failed to update booking status";
            if (error?.code === 'permission-denied') {
                errorMessage = "You don't have permission to update this booking";
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast.error("Update Failed", errorMessage);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setModalOpen(true);
    };

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'accepted': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-indigo-100 text-indigo-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 pb-8">
            {/* Premium Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[25vh] bg-gradient-to-b from-green-100/40 via-emerald-50/30 to-transparent pointer-events-none" />

            <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 pt-4 sm:pt-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                            My Bookings
                        </h1>
                        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Manage your assigned service bookings.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as BookingStatus | "all")}>
                            <SelectTrigger className="w-[140px] font-semibold">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                    {[
                        { label: "Total", count: bookings.length, color: "from-slate-600 to-slate-700", icon: null },
                        { label: "Pending", count: bookings.filter(b => b.status === 'pending').length, color: "from-amber-600 to-orange-600", icon: Clock },
                        { label: "In Progress", count: bookings.filter(b => b.status === 'in_progress').length, color: "from-indigo-600 to-purple-600", icon: null },
                        { label: "Completed", count: bookings.filter(b => b.status === 'completed').length, color: "from-green-600 to-emerald-600", icon: CheckCircle2 },
                        { label: "Cancelled", count: bookings.filter(b => b.status === 'cancelled').length, color: "from-red-600 to-pink-600", icon: null },
                    ].map((stat) => (
                        <Card key={stat.label} className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300 group hover:scale-[1.02]">
                            <CardContent className="p-4">
                                <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mb-2">{stat.label}</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                        {stat.count}
                                    </p>
                                    {stat.icon && <stat.icon className="w-5 h-5 text-slate-400" />}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300 overflow-hidden">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-base sm:text-lg font-black text-slate-900">All Bookings</CardTitle>
                        <CardDescription className="text-[11px] text-slate-500 font-medium">
                            {loading ? 'Loading...' : `${filteredBookings.length} ${filteredBookings.length === 1 ? 'booking' : 'bookings'}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-extrabold">Date</TableHead>
                                        <TableHead className="font-extrabold">Service</TableHead>
                                        <TableHead className="font-extrabold">Customer</TableHead>
                                        <TableHead className="font-extrabold">Price</TableHead>
                                        <TableHead className="font-extrabold">Payment</TableHead>
                                        <TableHead className="font-extrabold">Status</TableHead>
                                        <TableHead className="text-right font-extrabold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12">
                                                <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredBookings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                                {statusFilter !== "all"
                                                    ? "No bookings match your filter."
                                                    : "No bookings assigned to you yet."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBookings.map((booking) => (
                                            <TableRow key={booking.id} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="text-sm font-medium">
                                                    {booking.createdAt ? format(booking.createdAt.toDate(), "MMM dd, hh:mm a") : "Just now"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{booking.serviceName}</span>
                                                        <span className="text-xs text-slate-400">ID: {booking.id.slice(-8)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-slate-600">{booking.customerId.slice(-8)}</span>
                                                </TableCell>
                                                <TableCell className="font-black text-slate-900">₹{booking.servicePrice}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-slate-600">{booking.paymentMethod}</span>
                                                        <span className={`text-xs font-extrabold uppercase ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'
                                                            }`}>
                                                            {booking.paymentStatus}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getStatusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(booking)}
                                                            className="h-8 w-8 p-0 hover:bg-green-100"
                                                        >
                                                            <Eye className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        {isStatusLocked(booking.status) ? (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-md text-xs font-bold text-slate-500">
                                                                <Lock className="h-3 w-3" />
                                                                Locked
                                                            </div>
                                                        ) : (
                                                            <Select
                                                                value={booking.status}
                                                                onValueChange={(val: BookingStatus) => handleStatusChange(booking.id, val)}
                                                                disabled={updatingStatus === booking.id}
                                                            >
                                                                <SelectTrigger className="w-[140px] h-8 text-xs font-bold">
                                                                    {updatingStatus === booking.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <SelectValue />
                                                                    )}
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[100]">
                                                                    {getStatusDropdownOptions(booking.status).map((status) => (
                                                                        <SelectItem key={status} value={status}>
                                                                            {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Count */}
                {!loading && filteredBookings.length > 0 && (
                    <p className="text-sm text-slate-500 text-center font-medium">
                        Showing {filteredBookings.length} of {bookings.length} bookings
                    </p>
                )}

                {/* Booking Details Modal */}
                <BookingDetailsModal
                    booking={selectedBooking}
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    partnerLocation={profile?.location}
                />
            </div>
        </div>
    );
}
