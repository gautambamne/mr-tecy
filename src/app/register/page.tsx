"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../../components/ui/label";
import { AlertCircle, Loader2, Upload } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authService.register(email, password, name, photo || undefined);
            // Redirect to verification page
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await authService.loginWithGoogle();
            router.push("/");
        } catch (err: any) {
            setError("Failed to sign up with Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold text-slate-900">Create an account</h2>
                    <p className="mt-2 text-sm text-slate-600">Join Mr Tecy for home services</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        {error.includes("already exist") && (
                            <Link href="/login" className="font-bold underline ml-1">Sign In?</Link>
                        )}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 mb-2">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <Upload className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <Label htmlFor="photo" className="cursor-pointer text-blue-600 text-sm font-medium hover:text-blue-700">
                            Upload Profile Photo
                        </Label>
                        <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1"
                                placeholder="Create a password"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Sign up
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Google
                </Button>

                <p className="text-center text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
