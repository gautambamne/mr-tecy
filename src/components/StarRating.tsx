"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}

export function StarRating({
    rating,
    onRatingChange,
    readonly = false,
    size = "md"
}: StarRatingProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    const iconSize = sizeClasses[size];

    const handleClick = (value: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(value);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => {
                const isFilled = value <= rating;
                const isHalf = value - 0.5 === rating;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => handleClick(value)}
                        disabled={readonly}
                        className={`${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                    >
                        {isFilled || isHalf ? (
                            <Star
                                className={`${iconSize} text-amber-500 fill-amber-500`}
                            />
                        ) : (
                            <Star
                                className={`${iconSize} text-slate-300`}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
