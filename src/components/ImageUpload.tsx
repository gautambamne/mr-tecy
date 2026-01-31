"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
    maxImages?: number;
    onImagesChange: (files: File[]) => void;
    existingImages?: string[]; // URLs of already uploaded images
}

export function ImageUpload({ maxImages = 5, onImagesChange, existingImages = [] }: ImageUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [error, setError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setError("");

        // Validate file count
        const totalImages = selectedFiles.length + existingImages.length + files.length;
        if (totalImages > maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        // Validate each file
        const validFiles: File[] = [];
        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                setError("Only image files are allowed");
                continue;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setError(`${file.name} is too large. Maximum size is 5MB`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            const newFiles = [...selectedFiles, ...validFiles];
            setSelectedFiles(newFiles);
            onImagesChange(newFiles);

            // Create previews
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
        onImagesChange(newFiles);
        setError("");
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);

        // Create a mock event to reuse validation logic
        const mockEvent = {
            target: { files }
        } as any;

        handleFileSelect(mockEvent);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const totalImages = selectedFiles.length + existingImages.length;

    return (
        <div className="space-y-3">
            {/* Upload Area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors bg-slate-50 hover:bg-blue-50/50"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 mb-1">
                            Drop images here or click to upload
                        </p>
                        <p className="text-xs text-slate-500">
                            Maximum {maxImages} images, 5MB each
                        </p>
                        {totalImages > 0 && (
                            <p className="text-xs font-bold text-blue-600 mt-1">
                                {totalImages} / {maxImages} images selected
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Image Previews */}
            {(previews.length > 0 || existingImages.length > 0) && (
                <div className="grid grid-cols-3 gap-3">
                    {/* Existing Images */}
                    {existingImages.map((url, index) => (
                        <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200">
                            <img
                                src={url}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Uploaded
                            </div>
                        </div>
                    ))}

                    {/* New Previews */}
                    {previews.map((preview, index) => (
                        <div
                            key={`preview-${index}`}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200 bg-slate-100"
                        >
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
