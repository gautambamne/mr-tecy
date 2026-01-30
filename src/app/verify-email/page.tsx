"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle2 } from "lucide-react";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

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

                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm pt-8 pb-4">
                    <CardContent className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                                    <Mail className="w-10 h-10 text-blue-600" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
                            <p className="text-slate-500">
                                We have sent a verification link to <br />
                                <span className="font-semibold text-slate-900">{email}</span>
                            </p>
                            <p className="text-sm text-slate-400">
                                Just click on the link in that email to complete your signup.
                            </p>
                        </div>

                        <Link href="/login" className="block pt-2">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 rounded-xl shadow-md transition-all hover:shadow-lg active:scale-[0.98]">
                                Back to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
