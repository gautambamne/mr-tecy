"use client";

import { useState } from "react";
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
import { Plus, Pencil, Trash2, Loader2, TrendingUp, TrendingDown, Image as ImageIcon, X, Eye, Wrench, Package, DollarSign } from "lucide-react";
import { createServiceAction, updateServiceAction } from "@/actions/service.actions";
import { cloudinaryUploadService } from "@/services/cloudinary-upload.service";
import { Service, ServiceCategory } from "@/types";
import { useRealtimeServices } from "@/hooks/useRealtimeServices";
import { RealtimeIndicator } from "@/components/admin/RealtimeIndicator";
import { MobileDataCard } from "@/components/admin/MobileDataCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function ServicesPage() {
    const { services, loading } = useRealtimeServices({ onlyActive: false });
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "car" as ServiceCategory,
        description: "",
        price: "",
        durationMinutes: "60",
        iconUrl: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleOpenDialog = (service?: Service) => {
        if (service) {
            setEditingId(service.id);
            setFormData({
                name: service.name,
                category: service.category,
                description: service.description,
                price: service.price.toString(),
                durationMinutes: service.durationMinutes.toString(),
                iconUrl: service.iconUrl || "",
            });
            setImagePreview(service.iconUrl || null);
            setImageFile(null);
        } else {
            setEditingId(null);
            setFormData({
                name: "",
                category: "car",
                description: "",
                price: "",
                durationMinutes: "60",
                iconUrl: "",
            });
            setImagePreview(null);
            setImageFile(null);
        }
        setIsDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData({ ...formData, iconUrl: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let iconUrl = formData.iconUrl;

            // Upload image if a new file is selected
            if (imageFile) {
                try {
                    const result = await cloudinaryUploadService.uploadImage(imageFile, "services");
                    iconUrl = result.url;
                } catch (uploadError: any) {
                    console.error("[ServicesPage] Upload failed:", uploadError);
                    alert(`Upload failed: ${uploadError.message}`);
                    setSubmitting(false);
                    return;
                }
            }

            const dataToSave = {
                ...formData,
                price: parseFloat(formData.price),
                durationMinutes: parseInt(formData.durationMinutes),
                active: true,
                iconUrl,
            };

            if (editingId) {
                const result = await updateServiceAction(editingId, dataToSave);
                if (result.error) throw new Error(result.error);
            } else {
                const result = await createServiceAction(dataToSave);
                if (result.error) throw new Error(result.error);
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error("[ServicesPage] Error saving service:", error);
            alert(`Failed to save service: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (service: Service) => {
        try {
            await updateServiceAction(service.id, { active: !service.active });
        } catch (error) {
            console.error("Error toggling service status:", error);
        }
    };

    // Calculate stats
    const stats = [
        { label: "Total Services", value: services.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Active", value: services.filter(s => s.active).length, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        { label: "Inactive", value: services.filter(s => !s.active).length, icon: TrendingDown, color: "text-slate-500", bg: "bg-slate-100" },
        {
            label: "Avg Price",
            value: `₹${services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length) : 0}`,
            icon: DollarSign,
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
    ];

    return (
        <div className="min-h-screen pb-12 overflow-x-hidden">
            {/* Premium Background Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-blue-100/30 via-cyan-50/20 to-transparent pointer-events-none" />

            <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 pt-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Services
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Manage your service catalog and pricing.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <RealtimeIndicator />
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {stats.map((stat) => (
                        <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white/90 backdrop-blur">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-extrabold tracking-wider">{stat.label}</p>
                                    <p className={`text-2xl sm:text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Mobile Card View / Desktop Table View */}
                {isMobile ? (
                    <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
                            ))
                        ) : services.length === 0 ? (
                            <div className="text-center py-12 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-slate-100">
                                <Loader2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-400">No services found.</p>
                            </div>
                        ) : (
                            services.map((service) => (
                                <MobileDataCard
                                    key={service.id}
                                    title={service.name}
                                    subtitle={service.description}
                                    image={service.iconUrl}
                                    status={{
                                        label: service.active ? "Active" : "Inactive",
                                        variant: service.active ? "default" : "secondary"
                                    }}
                                    metadata={[
                                        { label: "Category", value: service.category },
                                        { label: "Price", value: `₹${service.price}` },
                                        { label: "Duration", value: `${service.durationMinutes} min` },
                                        { label: "Status", value: service.active ? "Active" : "Inactive" }
                                    ]}
                                    actions={[
                                        {
                                            label: "Edit",
                                            icon: <Pencil className="h-4 w-4" />,
                                            onClick: () => handleOpenDialog(service)
                                        },
                                        {
                                            label: service.active ? "Deactivate" : "Activate",
                                            icon: <Eye className="h-4 w-4" />,
                                            onClick: () => handleToggleStatus(service)
                                        }
                                    ]}
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <Card className="border-none shadow-md bg-white/90 backdrop-blur-md overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-b-slate-100">
                                        <TableHead className="font-bold text-slate-700">Service Name</TableHead>
                                        <TableHead className="font-bold text-slate-700">Category</TableHead>
                                        <TableHead className="font-bold text-slate-700">Base Price</TableHead>
                                        <TableHead className="font-bold text-slate-700">Duration</TableHead>
                                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12">
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : services.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                                No services found. Add your first service to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        services.map((service) => (
                                            <TableRow key={service.id} className="hover:bg-blue-50/30 transition-colors border-b-slate-50">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {service.iconUrl ? (
                                                            <img src={service.iconUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <Wrench className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{service.name}</span>
                                                            <span className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{service.description}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                                                        {service.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-black text-slate-900">₹{service.price}</TableCell>
                                                <TableCell className="text-sm text-slate-600">{service.durationMinutes} min</TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() => handleToggleStatus(service)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${service.active
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 ring-1 ring-green-200'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 ring-1 ring-slate-200'
                                                            }`}
                                                    >
                                                        {service.active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleOpenDialog(service)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-8 w-8 p-0 ${service.active
                                                                ? "text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                                : "text-slate-500 hover:text-green-600 hover:bg-green-50"
                                                                }`}
                                                            onClick={() => handleToggleStatus(service)}
                                                        >
                                                            {service.active ? <Trash2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                )}

                {/* Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/95 border-white/20 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">
                                {editingId ? "Edit Service" : "Add New Service"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="image" className="font-bold text-slate-700">Service Image</Label>
                                <div className="flex items-start gap-4">
                                    {imagePreview ? (
                                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                                            <span className="text-[10px] font-bold">No Image</span>
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-slate-50"
                                        />
                                        <p className="text-xs text-slate-500 font-medium">
                                            Recommended: Square image, max 2MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-bold text-slate-700">Service Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Full Car Maintenance"
                                    className="font-medium bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="font-bold text-slate-700">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                                    >
                                        <SelectTrigger className="bg-slate-50 border-slate-200 font-medium">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100]">
                                            <SelectItem value="car">Car</SelectItem>
                                            <SelectItem value="bike">Bike</SelectItem>
                                            <SelectItem value="electrician">Electrician</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="font-bold text-slate-700">Base Price (₹)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="299"
                                        className="font-medium bg-slate-50 border-slate-200"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="font-bold text-slate-700">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe what's included in this service..."
                                    rows={3}
                                    className="font-medium bg-slate-50 border-slate-200"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="font-bold text-slate-700">Duration (minutes)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={formData.durationMinutes}
                                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                    placeholder="60"
                                    className="font-medium bg-slate-50 border-slate-200"
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={submitting}
                                    className="font-bold text-slate-500"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        editingId ? "Update Service" : "Create Service"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
