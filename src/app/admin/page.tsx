"use client";

import { useEffect, useState } from "react";
import { Wrench, Users, Calendar, Banknote, TrendingUp, Activity, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/StatCard";
import { RealtimeIndicator } from "@/components/admin/RealtimeIndicator";
import { bookingService } from "@/services/booking.service";
import { serviceService } from "@/services/service.service";
import { partnerService } from "@/services/partner.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";

export default function AdminDashboard() {
    const { bookings, loading: bookingsLoading } = useRealtimeBookings();
    const [serviceStats, setServiceStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [partnerCount, setPartnerCount] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Subscribe to service stats
    useEffect(() => {
        const unsubscribe = serviceService.subscribeToServiceStats(
            (stats) => {
                setServiceStats(stats);
                setLastUpdated(new Date());
            },
            (error) => console.error("Error fetching service stats:", error)
        );

        return () => unsubscribe();
    }, []);

    // Subscribe to partners for real-time count
    useEffect(() => {
        const unsubscribe = partnerService.subscribeToPartners(
            (partners) => {
                setPartnerCount(partners.length);
                setLastUpdated(new Date());
            },
            (error) => console.error("Error fetching partners:", error)
        );

        return () => unsubscribe();
    }, []);

    // Calculate booking stats
    const bookingStats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        revenue: bookings
            .filter(b => b.paymentStatus === 'paid')
            .reduce((sum, b) => sum + b.servicePrice, 0),
    };

    const recentBookings = bookings.slice(0, 5);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-8">
            {/* Premium Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-blue-100/40 via-cyan-50/30 to-transparent pointer-events-none" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-6">
                {/* Header - Mobile Optimized */}
                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Welcome back! Here's what's happening today.</p>
                    </div>
                    <RealtimeIndicator lastUpdated={lastUpdated} />
                </div>

                {/* Stats Grid - Mobile: Single column, Tablet: 2 columns, Desktop: 4 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/admin/services">
                        <StatCard
                            title="Active Services"
                            value={serviceStats.active}
                            icon={Wrench}
                            color="from-blue-500 to-blue-600"
                            loading={false}
                        />
                    </Link>
                    <Link href="/admin/partners">
                        <StatCard
                            title="Total Partners"
                            value={partnerCount}
                            icon={Users}
                            color="from-cyan-500 to-cyan-600"
                            loading={false}
                        />
                    </Link>
                    <Link href="/admin/bookings">
                        <StatCard
                            title="Total Bookings"
                            value={bookingStats.total}
                            icon={Calendar}
                            color="from-indigo-500 to-indigo-600"
                            loading={bookingsLoading}
                        />
                    </Link>
                    <StatCard
                        title="Total Revenue"
                        value={`₹${bookingStats.revenue}`}
                        icon={Banknote}
                        color="from-emerald-500 to-emerald-600"
                        loading={bookingsLoading}
                    />
                </div>

                {/* Secondary Stats - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]">
                        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                            <CardTitle className="text-[10px] sm:text-xs font-extrabold tracking-wider text-amber-600 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Pending Bookings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 rounded-xl">
                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                                        {bookingStats.pending}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Requires attention</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]">
                        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                            <CardTitle className="text-[10px] sm:text-xs font-extrabold tracking-wider text-green-600 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Completed Today
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                                        {bookingStats.completed}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Services delivered</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]">
                        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                            <CardTitle className="text-[10px] sm:text-xs font-extrabold tracking-wider text-blue-600 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                Service Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                                        {serviceStats.total}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Total services offered</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Recent Bookings - Mobile Optimized */}
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg font-black text-slate-900">Recent Bookings</CardTitle>
                                    <CardDescription className="text-[11px] text-slate-500 font-medium">Latest service requests</CardDescription>
                                </div>
                                <Link href="/admin/bookings">
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs h-9 px-3 rounded-lg">
                                        View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {bookingsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : recentBookings.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">No bookings yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {recentBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-50/50 rounded-xl hover:from-slate-100 hover:to-slate-100/50 transition-all duration-200 border border-slate-100 hover:border-slate-200 hover:shadow-md"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{booking.serviceName}</p>
                                                    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">ID: {booking.id.slice(-8)}</p>
                                            </div>
                                            <div className="text-right ml-3 flex-shrink-0">
                                                <p className="font-black text-slate-900 text-base sm:text-lg">₹{booking.servicePrice}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions - Mobile Optimized */}
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base sm:text-lg font-black text-slate-900">Quick Actions</CardTitle>
                            <CardDescription className="text-[11px] text-slate-500 font-medium">Common administrative tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 sm:gap-4">
                            <Link href="/admin/services" className="touch-target">
                                <Button className="w-full h-24 sm:h-28 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold flex flex-col gap-2 sm:gap-2.5 rounded-2xl shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                                    <Wrench className="h-6 w-6 sm:h-7 sm:w-7" />
                                    <span className="text-xs sm:text-sm font-extrabold">Manage Services</span>
                                </Button>
                            </Link>
                            <Link href="/admin/partners" className="touch-target">
                                <Button variant="outline" className="w-full h-24 sm:h-28 border-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300 font-bold flex flex-col gap-2 sm:gap-2.5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                                    <Users className="h-6 w-6 sm:h-7 sm:w-7" />
                                    <span className="text-xs sm:text-sm font-extrabold">Add Partner</span>
                                </Button>
                            </Link>
                            <Link href="/admin/bookings" className="touch-target">
                                <Button variant="outline" className="w-full h-24 sm:h-28 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-bold flex flex-col gap-2 sm:gap-2.5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                                    <Calendar className="h-6 w-6 sm:h-7 sm:w-7" />
                                    <span className="text-xs sm:text-sm font-extrabold">View Bookings</span>
                                </Button>
                            </Link>
                            <Link href="/" className="touch-target">
                                <Button variant="outline" className="w-full h-24 sm:h-28 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-bold flex flex-col gap-2 sm:gap-2.5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                                    <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
                                    <span className="text-xs sm:text-sm font-extrabold">Go to Website</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* System Health - Mobile Optimized */}
                <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base sm:text-lg font-black text-slate-900">System Health</CardTitle>
                        <CardDescription className="text-[11px] text-green-600 font-bold flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            All systems operational
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-200 hover:border-green-300 transition-all hover:shadow-md">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Firestore Database</p>
                                    <p className="text-[10px] text-green-600 font-extrabold uppercase tracking-wide">Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-200 hover:border-green-300 transition-all hover:shadow-md">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Authentication</p>
                                    <p className="text-[10px] text-green-600 font-extrabold uppercase tracking-wide">Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-200 hover:border-green-300 transition-all hover:shadow-md">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Storage Bucket</p>
                                    <p className="text-[10px] text-green-600 font-extrabold uppercase tracking-wide">Online</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
