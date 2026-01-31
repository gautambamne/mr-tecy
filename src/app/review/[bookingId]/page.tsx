"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/services/booking.service";
import { reviewService } from "@/services/review.service";
import { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { ChevronLeft, Loader2, CheckCircle2, User } from "lucide-react";

export default function ReviewPage() {
    const { bookingId } = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId, user]);

    const fetchBooking = async () => {
        try {
            const bookings = await bookingService.getCustomerBookings(user!.uid);
            const currentBooking = bookings.find(b => b.id === bookingId);

            if (currentBooking) {
                setBooking(currentBooking);

                // Check if booking is completed
                if (currentBooking.status !== 'completed') {
                    alert("You can only review completed bookings");
                    router.push("/history");
                    return;
                }

                // Check if already reviewed
                const existingReview = await reviewService.getReviewByBooking(bookingId as string);
                if (existingReview) {
                    alert("You have already reviewed this booking");
                    router.push("/history");
                    return;
                }
            }
        } catch (error) {
            console.error("Error fetching booking:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!feedback.trim()) {
            alert("Please write your feedback");
            return;
        }

        if (!booking || !user || !profile) {
            alert("Missing information");
            return;
        }

        setSubmitting(true);

        try {
            await reviewService.createReview({
                bookingId: booking.id,
                customerId: user.uid,
                customerName: profile.displayName,
                partnerId: booking.partnerId,
                partnerName: booking.partnerName,
                rating,
                feedback: feedback.trim(),
            });

            // Show success message
            alert("Thank you for your feedback!");

            // Navigate back to history
            router.push("/history");
        } catch (error: any) {
            console.error("Error submitting review:", error);
            alert(error.message || "Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <p className="text-slate-600 font-medium mb-4">Booking not found</p>
                <Button onClick={() => router.push("/history")}>Back to History</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <div className="bg-white border-b px-4 py-4 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-extrabold text-slate-900">Rate Your Experience</h1>
                </div>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-6 pt-6">
                {/* Booking Summary */}
                <Card className="shadow-md border-none">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider">
                                    Completed Service
                                </p>
                                <p className="font-extrabold text-slate-900">{booking.serviceName}</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-extrabold">
                                    {booking.partnerName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Service Partner</p>
                                    <p className="font-bold text-slate-900">{booking.partnerName}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rating Section */}
                <Card className="shadow-md border-none">
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <h3 className="font-extrabold text-lg text-slate-900 mb-4 text-center">
                                How was your experience?
                            </h3>

                            <div className="flex flex-col items-center gap-4">
                                <StarRating
                                    rating={rating}
                                    onRatingChange={setRating}
                                    size="lg"
                                />
                                <p className="text-sm font-bold text-slate-600">
                                    {rating === 5 && "Excellent! ⭐"}
                                    {rating === 4 && "Great! 👍"}
                                    {rating === 3 && "Good"}
                                    {rating === 2 && "Could be better"}
                                    {rating === 1 && "Needs improvement"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 block">
                                Share Your Feedback
                            </label>
                            <Textarea
                                placeholder="Tell us about your experience with the service and the partner..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={5}
                                className="resize-none rounded-xl border-2 border-slate-200 focus:border-blue-400"
                            />
                            <p className="text-xs text-slate-500">
                                Your feedback helps us improve and helps other customers make informed decisions
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <Button
                    onClick={handleSubmitReview}
                    disabled={!feedback.trim() || submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                >
                    {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Submit Review"
                    )}
                </Button>
            </main>
        </div>
    );
}
