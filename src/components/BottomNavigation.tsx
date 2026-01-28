"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ClipboardList, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
    const pathname = usePathname()

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/booking", icon: Plus, label: "Book Now", isFloating: true },
        { href: "/history", icon: ClipboardList, label: "History" },
    ]

    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 px-6">
            <div className="max-w-md mx-auto bg-[#1a36a4] rounded-[32px] shadow-2xl">
                <div className="flex items-center justify-between h-16 px-8 relative">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        if (item.isFloating) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="absolute left-1/2 -translate-x-1/2 -top-5"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-full bg-white border-4 border-[#1a36a4] shadow-lg flex items-center justify-center transition-transform active:scale-95">
                                            <Icon className="w-7 h-7 text-[#1a36a4]" strokeWidth={3} />
                                        </div>
                                        <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-wider">
                                            {item.label}
                                        </span>
                                    </div>
                                </Link>
                            )
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 transition-opacity",
                                    isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <Icon
                                    className="w-6 h-6 text-white"
                                    strokeWidth={2}
                                />
                                <span className="text-xs font-medium text-white">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}