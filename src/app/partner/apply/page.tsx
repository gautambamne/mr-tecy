"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { partnerApplicationService } from "@/services/partner.service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Briefcase, Phone, MapPin, Award, CheckCircle2, Mail } from "lucide-react";
import { SERVICE_CATEGORIES, CATEGORY_DISPLAY_NAMES } from "@/constants/categories";

// Available skills for partners
const AVAILABLE_SKILLS = SERVICE_CATEGORIES.map(cat => CATEGORY_DISPLAY_NAMES[cat]);

// Form validation schema
const partnerApplicationSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Valid email is required"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
    skills: z.array(z.string()).min(1, "Select at least one skill"),
    serviceArea: z.string().min(2, "Service area must be at least 2 characters"),
    experience: z.number().min(0, "Experience must be a positive number").max(50, "Experience must be less than 50 years")
});

type PartnerApplicationForm = z.infer<typeof partnerApplicationSchema>;

export default function PartnerApplyPage() {
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<PartnerApplicationForm>({
        resolver: zodResolver(partnerApplicationSchema),
        defaultValues: {
            skills: []
        }
    });

    // Auto-fill form with user profile data
    useEffect(() => {
        if (profile || user) {
            // Pre-fill name from profile
            if (profile?.displayName) {
                setValue("fullName", profile.displayName);
            } else if (user?.displayName) {
                setValue("fullName", user.displayName);
            }

            // Pre-fill email from user account
            if (user?.email) {
                setValue("email", user.email);
            } else if (profile?.email) {
                setValue("email", profile.email);
            }

            // Pre-fill phone from profile
            const phone = profile?.phoneNumber || profile?.phone || "";
            if (phone) {
                // Remove any non-digit characters for validation
                const cleanPhone = phone.replace(/\D/g, "");
                if (cleanPhone.length === 10) {
                    setValue("phone", cleanPhone);
                }
            }
        }
    }, [profile, user, setValue]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Check if user already has an application
    useEffect(() => {
        async function checkExistingApplication() {
            if (user) {
                try {
                    const existingApp = await partnerApplicationService.getPartnerStatus(user.uid);
                    if (existingApp) {
                        router.push("/partner/status");
                    }
                } catch (error) {
                    console.error("Error checking application:", error);
                }
            }
        }

        checkExistingApplication();
    }, [user, router]);

    const handleSkillToggle = (skill: string) => {
        const newSkills = selectedSkills.includes(skill)
            ? selectedSkills.filter(s => s !== skill)
            : [...selectedSkills, skill];

        setSelectedSkills(newSkills);
        setValue("skills", newSkills, { shouldValidate: true });
    };

    const onSubmit = async (data: PartnerApplicationForm) => {
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await partnerApplicationService.applyForPartner(user.uid, {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                skills: data.skills,
                serviceArea: data.serviceArea,
                experience: data.experience
            });

            router.push("/partner/status");
        } catch (err) {
            console.error("Error submitting application:", err);
            setError(err instanceof Error ? err.message : "Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4">
            {/* Background */}
            <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-blue-100/40 via-cyan-50/30 to-transparent pointer-events-none" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
                <Card className="border-none shadow-xl bg-white/95 backdrop-blur-md">
                    <CardHeader className="text-center pb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Become a Partner
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 mt-2">
                            Join our network of trusted professionals and grow your business
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Full Name
                                </Label>
                                <Input
                                    id="fullName"
                                    {...register("fullName")}
                                    placeholder="Enter your full name"
                                    className="h-12"
                                    disabled={isSubmitting}
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-red-600">{errors.fullName.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register("email")}
                                    placeholder="Enter your email"
                                    className="h-12"
                                    disabled={isSubmitting}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    {...register("phone")}
                                    placeholder="Enter 10-digit phone number"
                                    className="h-12"
                                    disabled={isSubmitting}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                                )}
                            </div>

                            {/* Skills */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Skills (Select at least one)
                                </Label>
                                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    {AVAILABLE_SKILLS.map((skill) => (
                                        <div key={skill} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={skill}
                                                checked={selectedSkills.includes(skill)}
                                                onChange={() => handleSkillToggle(skill)}
                                                disabled={isSubmitting}
                                            />
                                            <label
                                                htmlFor={skill}
                                                className="text-sm font-medium text-slate-700 cursor-pointer"
                                            >
                                                {skill}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.skills && (
                                    <p className="text-sm text-red-600">{errors.skills.message}</p>
                                )}
                            </div>

                            {/* Service Area */}
                            <div className="space-y-2">
                                <Label htmlFor="serviceArea" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Service Area
                                </Label>
                                <Input
                                    id="serviceArea"
                                    {...register("serviceArea")}
                                    placeholder="Enter your service area (e.g., New York, Brooklyn)"
                                    className="h-12"
                                    disabled={isSubmitting}
                                />
                                {errors.serviceArea && (
                                    <p className="text-sm text-red-600">{errors.serviceArea.message}</p>
                                )}
                            </div>

                            {/* Experience */}
                            <div className="space-y-2">
                                <Label htmlFor="experience" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Years of Experience
                                </Label>
                                <Input
                                    id="experience"
                                    type="number"
                                    {...register("experience", { valueAsNumber: true })}
                                    placeholder="Enter years of experience"
                                    className="h-12"
                                    min="0"
                                    max="50"
                                    disabled={isSubmitting}
                                />
                                {errors.experience && (
                                    <p className="text-sm text-red-600">{errors.experience.message}</p>
                                )}
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base shadow-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting Application...
                                    </>
                                ) : (
                                    <>
                                        <Briefcase className="mr-2 h-5 w-5" />
                                        Submit Application
                                    </>
                                )}
                            </Button>

                            <p className="text-sm text-center text-slate-500 mt-4">
                                By submitting this application, you agree to our terms and conditions.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
