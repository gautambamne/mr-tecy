"use client";

import { useRouter } from "next/navigation";

interface CategoryCardProps {
    image: string;
    label: string;
    category?: string;
}

export function CategoryCard({ image, label, category }: CategoryCardProps) {
    const router = useRouter();

    const handleClick = () => {
        // For "For You" category (empty category), show all services
        if (!category) {
            router.push('/services');
            return;
        }

        // Navigate to dedicated category page
        const categoryParam = category || label;
        router.push(`/category/${encodeURIComponent(categoryParam.toLowerCase())}`);
    };

    return (
        <button
            onClick={handleClick}
            className="flex flex-col items-center gap-2.5 group cursor-pointer"
        >
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-md ring-2 ring-slate-100 group-hover:ring-blue-300 transition-all duration-300 group-hover:scale-105">
                <img
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                {label}
            </span>
        </button>
    );
}
