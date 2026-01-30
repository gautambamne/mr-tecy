"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-lg">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>

                <p className="text-slate-600">
                    We have sent you a verification email to <span className="font-semibold text-slate-900">{email}</span>.
                    Please verify it and log in.
                </p>

                <Link href="/login" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Log in
                    </Button>
                </Link>
            </div>
        </div>
    );
}
