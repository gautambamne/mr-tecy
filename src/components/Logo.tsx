import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative w-8 h-8 flex-shrink-0">
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-sm"
                >
                    {/* Base 'M' shape - Dark Blue */}
                    {/* Parallel slopes to diamond with ~10 unit vertical gap */}
                    {/* Diamond Left Slope: 1. M Left Slope: 1. Diamond Right Slope: -1. M Right Slope: -1. */}
                    <path
                        d="M10 50 L25 50 L50 75 L75 50 L90 50 L90 85 L65 85 L50 70 L35 85 L10 85 Z"
                        fill="#1e40af" // blue-800
                    />

                    {/* Top Diamond - Cyan */}
                    <path
                        d="M50 15 L75 40 L50 65 L25 40 Z"
                        fill="#22d3ee" // cyan-400
                    />
                </svg>
            </div>

            {showText && (
                <span className="font-bold text-xl text-[#1e40af] tracking-tight">
                    Mr Tecy
                </span>
            )}
        </div>
    );
}
