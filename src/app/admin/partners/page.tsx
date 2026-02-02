"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Plus, Pencil, Loader2, Users, MapPin, Star, CheckCircle2, UserCheck, Clock } from "lucide-react";
import { partnerService } from "@/services/partner.service";
import { serviceService } from "@/services/service.service";
import { Partner, Service } from "@/types";
import { GeoPoint } from "firebase/firestore";
import { MobileDataCard } from "@/components/admin/MobileDataCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        contactInfo: "",
        availability: "offline" as "online" | "offline",
        selectedServices: [] as string[],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [partnersData, servicesData] = await Promise.all([
                partnerService.getPartners(),
                serviceService.getServices()
            ]);
            setPartners(partnersData);
            setServices(servicesData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (partner?: Partner) => {
        if (partner) {
            setEditingId(partner.id);
            setFormData({
                name: partner.name,
                bio: partner.bio,
                contactInfo: partner.contactInfo || "",
                availability: partner.availability,
                selectedServices: partner.services,
            });
        } else {
            setEditingId(null);
            setFormData({
                name: "",
                bio: "",
                contactInfo: "",
                availability: "offline",
                selectedServices: [],
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const dataToSave = {
                ...formData,
                services: formData.selectedServices,
                location: new GeoPoint(0, 0), // Placeholder
                isVerified: true
            };

            if (editingId) {
                await partnerService.updatePartner(editingId, dataToSave);
            } else {
                await partnerService.createPartner(dataToSave as any);
            }
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving partner:", error);
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate stats
    const stats = {
        total: partners.length,
        online: partners.filter(p => p.availability === 'online').length,
        offline: partners.filter(p => p.availability === 'offline').length,
        avgRating: partners.length > 0
            ? (partners.reduce((sum, p) => sum + p.rating, 0) / partners.length).toFixed(1)
            : '0.0'
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                        Partners & Technicians
                    </h1>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Manage your fleet of service providers.</p>
                </div>
                <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold gap-2 shadow-lg shadow-blue-200 h-10 sm:h-11 px-4 sm:px-6 touch-target"
                >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Register Partner</span>
                    <span className="sm:hidden">Register</span>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100 group">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-extrabold tracking-wider">Total Partners</p>
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform">{stats.total}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-green-100 group">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <p className="text-[10px] sm:text-xs text-green-700 uppercase font-extrabold tracking-wider">Online</p>
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-green-700 group-hover:scale-105 transition-transform">{stats.online}</p>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 group">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-extrabold tracking-wider">Offline</p>
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-600 group-hover:scale-105 transition-transform">{stats.offline}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-amber-100 group">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <p className="text-[10px] sm:text-xs text-amber-700 uppercase font-extrabold tracking-wider">Avg Rating</p>
                        <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 fill-amber-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-amber-700 group-hover:scale-105 transition-transform">{stats.avgRating}</p>
                </div>
            </div>

            {/* Mobile Card View / Desktop Table View */}
            {isMobile ? (
                <div className="space-y-3">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
                        ))
                    ) : partners.length === 0 ? (
                        <div className="text-center py-12 bg-white/95 backdrop-blur-md rounded-xl shadow-md">
                            <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-400">No partners registered yet.</p>
                        </div>
                    ) : (
                        partners.map((partner) => {
                            const partnerSkills = partner.services.map(s => {
                                const service = services.find(sv => sv.id === s);
                                return service?.name || s;
                            });

                            return (
                                <MobileDataCard
                                    key={partner.id}
                                    title={partner.name}
                                    subtitle={partner.bio}
                                    status={{
                                        label: partner.availability === 'online' ? 'Online' : 'Offline',
                                        variant: partner.availability === 'online' ? 'default' : 'secondary'
                                    }}
                                    metadata={[
                                        { label: "Rating", value: `★ ${partner.rating.toFixed(1)}` },
                                        { label: "Skills", value: `${partner.services.length} services` },
                                        { label: "Contact", value: partner.contactInfo || 'N/A' }
                                    ]}
                                    actions={[
                                        {
                                            label: "Edit",
                                            icon: <Pencil className="h-4 w-4" />,
                                            onClick: () => handleOpenDialog(partner)
                                        }
                                    ]}
                                />
                            );
                        })
                    )}
                </div>
            ) : (
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold">Partner Name</TableHead>
                                <TableHead className="font-bold">Skills</TableHead>
                                <TableHead className="font-bold">Rating</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : partners.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                                        No partners registered yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                partners.map((partner) => (
                                    <TableRow key={partner.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {partner.name.charAt(0)}
                                                </div>
                                                {partner.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {partner.services.slice(0, 2).map(s => {
                                                    const service = services.find(sv => sv.id === s);
                                                    return (
                                                        <span key={s} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                                            {service?.name || s}
                                                        </span>
                                                    )
                                                })}
                                                {partner.services.length > 2 && <span className="text-[10px] text-slate-400">+{partner.services.length - 2} more</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                <span>★</span> {partner.rating.toFixed(1)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${partner.availability === 'online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {partner.availability}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-500"
                                                onClick={() => handleOpenDialog(partner)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Partner" : "Register Partner"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="pname">Full Name</Label>
                            <Input
                                id="pname"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Technician Name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact">Contact Info</Label>
                            <Input
                                id="contact"
                                value={formData.contactInfo}
                                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                placeholder="Phone or Email"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Availability</Label>
                            <Select
                                value={formData.availability}
                                onValueChange={(val: any) => setFormData({ ...formData, availability: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Skills (Services)</Label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded-md bg-slate-50">
                                {services.map(service => (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => {
                                            const current = formData.selectedServices;
                                            const updated = current.includes(service.id)
                                                ? current.filter(id => id !== service.id)
                                                : [...current, service.id];
                                            setFormData({ ...formData, selectedServices: updated });
                                        }}
                                        className={`text-[10px] px-2 py-1 rounded-full font-bold transition-colors ${formData.selectedServices.includes(service.id)
                                            ? "bg-blue-600 text-white"
                                            : "bg-white border text-slate-500 hover:border-blue-300"
                                            }`}
                                    >
                                        {service.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio / Notes</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Experience, specialized tools, etc."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full" disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? "Update Partner" : "Register Partner"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
