"use client";

import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/booking.service";
import { reviewService } from "@/services/review.service";
import { Booking, Review } from "@/types";
import { useState, useEffect } from "react";
import { Loader2, Calendar, Star, CheckCircle2, DollarSign, Clock, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeIndicator } from "@/components/admin/RealtimeIndicator";


export default function PartnerDashboard() {
    const { profile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        if (!profile?.uid) return;

        setLoading(true);

        // Subscribe to partner bookings
        const unsubBookings = bookingService.subscribeToPartnerBookings(
            profile.uid,
            (data) => {
                setBookings(data);
                setLoading(false);
                setLastUpdated(new Date());
            },
            (error) => {
                console.error("Error fetching partner bookings:", error);
                setLoading(false);
            }
        );

        // Subscribe to partner reviews
        const unsubReviews = reviewService.subscribeToPartnerReviews(
            profile.uid,
            (data) => {
                setReviews(data);
                setLastUpdated(new Date());
            },
            (error) => {
                console.error("Error fetching partner reviews:", error);
            }
        );

        return () => {
            unsubBookings();
            unsubReviews();
        };
    }, [profile?.uid]);

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        inProgress: bookings.filter(b => b.status === 'in_progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.servicePrice, 0),
        avgRating: profile?.rating || 0,
        totalReviews: reviews.length,
    };

    const upcomingBookings = bookings
        .filter(b => b.status === 'pending' || b.status === 'accepted')
        .slice(0, 5);

    const recentBookings = bookings.slice(0, 5);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 pb-8">
            {/* Premium Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-green-100/40 via-emerald-50/30 to-transparent pointer-events-none" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pt-4 sm:pt-6">
                {/* Header - Mobile Optimized */}
                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Welcome back, {profile?.displayName}!</p>
                    </div>
                    <RealtimeIndicator lastUpdated={lastUpdated} />
                </div>

                {/* Stats Grid - Mobile: Single column, Tablet: 2 columns, Desktop: 4 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/partner/dashboard/bookings">
                        <StatCard
                            title="Total Bookings"
                            value={stats.total}
                            icon={Calendar}
                            color="from-green-500 to-green-600"
                            loading={loading}
                        />
                    </Link>
                    <Link href="/partner/dashboard/bookings?filter=completed">
                        <StatCard
                            title="Completed"
                            value={stats.completed}
                            icon={CheckCircle2}
                            color="from-emerald-500 to-emerald-600"
                            loading={loading}
                        />
                    </Link>
                    <Link href="/partner/dashboard/reviews">
                        <StatCard
                            title="Average Rating"
                            value={stats.avgRating.toFixed(1)}
                            icon={Star}
                            color="from-amber-500 to-amber-600"
                            loading={false}
                        />
                    </Link>
                    <StatCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue}`}
                        icon={DollarSign}
                        color="from-blue-500 to-blue-600"
                        loading={loading}
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue}`}
                        icon={DollarSign}
                        color="from-blue-500 to-blue-600"
                        loading={loading}
                    />
                </div>

                {/* Location Manager */}
                {/* Location Status Card */}
                <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                Service Location
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 font-medium max-w-md">
                                {profile?.location?.address || "Location not set. Set your location to get nearby bookings."}
                            </CardDescription>
                        </div>
                        <Link href="/partner/dashboard/location">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold">
                                Manage Location
                            </Button>
                        </Link>
                    </CardHeader>
                </Card>

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
                                        {stats.pending}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Requires attention</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]">
                        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                            <CardTitle className="text-[10px] sm:text-xs font-extrabold tracking-wider text-indigo-600 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 rounded-xl">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                                        {stats.inProgress}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Active jobs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]">
                        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                            <CardTitle className="text-[10px] sm:text-xs font-extrabold tracking-wider text-green-600 uppercase flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Total Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                                        {stats.totalReviews}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Customer feedback</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Upcoming Bookings - Mobile Optimized */}
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg font-black text-slate-900">Upcoming Bookings</CardTitle>
                                    <CardDescription className="text-[11px] text-slate-500 font-medium">Pending and accepted jobs</CardDescription>
                                </div>
                                <Link href="/partner/dashboard/bookings">
                                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 font-bold text-xs h-9 px-3 rounded-lg">
                                        View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : upcomingBookings.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">No upcoming bookings</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {upcomingBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-50/50 rounded-xl hover:from-slate-100 hover:to-slate-100/50 transition-all duration-200 border border-slate-100 hover:border-slate-200 hover:shadow-md"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-900 truncate text-sm sm:text-base">{booking.serviceName}</p>
                                                    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        booking.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {booking.createdAt ? format(booking.createdAt.toDate(), "MMM dd, hh:mm a") : "Just now"}
                                                </p>
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

                    {/* Recent Reviews */}
                    <Card className="border-none shadow-md hover:shadow-xl bg-white/95 backdrop-blur-md transition-all duration-300">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg font-black text-slate-900">Recent Reviews</CardTitle>
                                    <CardDescription className="text-[11px] text-slate-500 font-medium">Latest customer feedback</CardDescription>
                                </div>
                                <Link href="/partner/dashboard/reviews">
                                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 font-bold text-xs h-9 px-3 rounded-lg">
                                        View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {reviews.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">No reviews yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {reviews.slice(0, 5).map((review) => (
                                        <div
                                            key={review.id}
                                            className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-50/50 rounded-xl hover:from-slate-100 hover:to-slate-100/50 transition-all duration-200 border border-slate-100 hover:border-slate-200 hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{review.customerName}</p>
                                                    <div className="flex items-center mt-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    {review.createdAt ? format(review.createdAt.toDate(), "MMM dd") : "Recent"}
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2">{review.feedback}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
