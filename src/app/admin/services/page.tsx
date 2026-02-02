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
import { Plus, Pencil, Trash2, Loader2, TrendingUp, TrendingDown, Image as ImageIcon, X, Eye } from "lucide-react";
import { createServiceAction, updateServiceAction } from "@/actions/service.actions";
import { cloudinaryUploadService } from "@/services/cloudinary-upload.service";
import { Service, ServiceCategory } from "@/types";
import { useRealtimeServices } from "@/hooks/useRealtimeServices";
import { RealtimeIndicator } from "@/components/admin/RealtimeIndicator";
import { MobileDataCard } from "@/components/admin/MobileDataCard";
import { Avatar } from "@/components/ui/avatar";
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
        category: "Appliance" as ServiceCategory,
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
                category: "Appliance",
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
        console.log("[ServicesPage] Form submitted");
        setSubmitting(true);
        try {
            let iconUrl = formData.iconUrl;

            // Upload image if a new file is selected
            if (imageFile) {
                console.log("[ServicesPage] New image selected. Starting upload...");
                // Upload directly to Cloudinary
                try {
                    const result = await cloudinaryUploadService.uploadImage(imageFile, "services");
                    iconUrl = result.url;
                    console.log("[ServicesPage] Image uploaded successfully. URL:", iconUrl);
                } catch (uploadError: any) {
                    console.error("[ServicesPage] Upload failed:", uploadError);
                    alert(`Upload failed: ${uploadError.message}`);
                    setSubmitting(false);
                    return;
                }
            } else {
                console.log("[ServicesPage] No new image selected. Using existing URL (if any).");
            }

            const dataToSave = {
                ...formData,
                price: parseFloat(formData.price),
                durationMinutes: parseInt(formData.durationMinutes),
                active: true,
                iconUrl,
            };

            console.log("[ServicesPage] Saving service data via Server Action:", dataToSave);

            if (editingId) {
                const result = await updateServiceAction(editingId, dataToSave);
                if (result.error) throw new Error(result.error);
                console.log("[ServicesPage] Service updated");
            } else {
                const result = await createServiceAction(dataToSave);
                if (result.error) throw new Error(result.error);
                console.log("[ServicesPage] Service created");
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
    const stats = {
        total: services.length,
        active: services.filter(s => s.active).length,
        inactive: services.filter(s => !s.active).length,
        avgPrice: services.length > 0
            ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)
            : 0,
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                        Service Catalog
                    </h1>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Manage your automotive and appliance services.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <RealtimeIndicator />
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold gap-2 shadow-lg shadow-blue-200 h-10 sm:h-11 px-4 sm:px-6 touch-target"
                    >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Add Service</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100 group">
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-extrabold tracking-wider">Total Services</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2 group-hover:scale-105 transition-transform">{stats.total}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-green-100 group">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] sm:text-xs text-green-700 uppercase font-extrabold tracking-wider">Active</p>
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-green-700 mt-1 sm:mt-2 group-hover:scale-105 transition-transform">{stats.active}</p>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 group">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-extrabold tracking-wider">Inactive</p>
                        <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-600 mt-1 sm:mt-2 group-hover:scale-105 transition-transform">{stats.inactive}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-blue-100 group">
                    <p className="text-[10px] sm:text-xs text-blue-700 uppercase font-extrabold tracking-wider">Avg Price</p>
                    <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-1 sm:mt-2 group-hover:scale-105 transition-transform">₹{stats.avgPrice}</p>
                </div>
            </div>

            {/* Mobile Card View / Desktop Table View */}
            {isMobile ? (
                <div className="space-y-3">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
                        ))
                    ) : services.length === 0 ? (
                        <div className="text-center py-12 bg-white/95 backdrop-blur-md rounded-xl shadow-md">
                            <Loader2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-400">No services found. Add your first service to get started.</p>
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
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold">Service Name</TableHead>
                                    <TableHead className="font-bold">Category</TableHead>
                                    <TableHead className="font-bold">Base Price</TableHead>
                                    <TableHead className="font-bold">Duration</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="text-right font-bold">Actions</TableHead>
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
                                        <TableRow key={service.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{service.name}</span>
                                                    <span className="text-xs text-slate-400 line-clamp-1">{service.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                                    {service.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900">₹{service.price}</TableCell>
                                            <TableCell className="text-sm text-slate-600">{service.durationMinutes} min</TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleToggleStatus(service)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${service.active
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                                                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                                                        onClick={() => handleOpenDialog(service)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-8 w-8 p-0 ${service.active
                                                            ? "text-slate-500 hover:text-red-600"
                                                            : "text-slate-500 hover:text-green-600"
                                                            }`}
                                                        onClick={() => handleToggleStatus(service)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editingId ? "Edit Service" : "Add New Service"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="image">Service Image</Label>
                            <div className="flex items-start gap-4">
                                {imagePreview ? (
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                        <ImageIcon className="h-8 w-8 mb-1" />
                                        <span className="text-[10px]">No Image</span>
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="cursor-pointer text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Recommended: Square image, max 2MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Service Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Full Car Maintenance"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100]">
                                        <SelectItem value="Vehicle">Vehicle</SelectItem>
                                        <SelectItem value="Appliance">Appliance</SelectItem>
                                        <SelectItem value="Electronics">Electronics</SelectItem>
                                        <SelectItem value="Plumbing">Plumbing</SelectItem>
                                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Base Price (₹)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="299"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what's included in this service..."
                                rows={3}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                placeholder="60"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700"
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
    );
}

