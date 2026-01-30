"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AlertCircle, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authService.resetPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-50">
            {/* Background Gradient Layer */}
            <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-[#A1F6FB] via-[#DBFDFC] to-slate-50 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center transform rotate-3 shadow-md">
                            <div className="w-5 h-5 bg-white transform rotate-45"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Mr tecy</h1>
                    </div>
                </div>

                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                    {success ? (
                        <CardContent className="pt-8 pb-8 text-center space-y-6 animate-in zoom-in-95">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">Link Sent!</h2>
                                <p className="text-slate-600">
                                    We sent a password change link to <br />
                                    <span className="font-semibold text-slate-900">{email}</span>
                                </p>
                            </div>

                            <Link href="/login" className="block pt-2">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 rounded-xl shadow-md transition-all hover:shadow-lg active:scale-[0.98]">
                                    Back to Sign In
                                </Button>
                            </Link>
                        </CardContent>
                    ) : (
                        <>
                            <CardHeader className="text-center space-y-1 pb-2">
                                <div className="flex justify-center mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Forgot Password?</CardTitle>
                                <CardDescription className="text-slate-500">
                                    No worries, we'll send you reset instructions.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in-50">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleReset} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 rounded-xl shadow-md transition-all hover:shadow-lg active:scale-[0.98]" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Get Reset Link
                                    </Button>
                                </form>
                            </CardContent>

                            <CardFooter className="justify-center pb-6">
                                <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to log in
                                </Link>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
