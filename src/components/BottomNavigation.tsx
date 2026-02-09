"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, User, Bell, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useEffect, useState } from "react"
import { notificationService } from "@/services/notification.service"

export function BottomNavigation() {
    const pathname = usePathname()
    const { profile, user } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!user) {
            setUnreadCount(0)
            return
        }

        const unsubscribe = notificationService.subscribeToNotifications(user.uid, (notifications) => {
            const count = notifications.filter(n => !n.read).length
            setUnreadCount(count)
        })

        return () => unsubscribe()
    }, [user])

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        {
            href: "/notifications",
            icon: Bell,
            label: "Notification",
            badge: unreadCount > 0 ? unreadCount : undefined
        },
        { href: "/booking", icon: Plus, label: "Book Now", isFloating: true },
        { href: "/history", icon: History, label: "History" },
        { href: "/profile", icon: User, label: "Account" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto bg-[#1a36a4] rounded-t-3xl shadow-2xl">
                <div className="grid grid-cols-5 items-center h-16 px-4 relative">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        if (item.isFloating) {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="col-start-3 flex justify-center"
                                >
                                    <div className="flex flex-col items-center -mt-8 gap-1">
                                        <div className="w-16 h-16 rounded-full bg-white border-[3px] border-[#1a36a4] shadow-xl flex items-center justify-center transition-transform active:scale-95">
                                            <Icon className="w-8 h-8 text-[#1a36a4]" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[9px] font-bold text-white uppercase tracking-wide whitespace-nowrap">
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
                                    "flex flex-col items-center gap-0.5 transition-opacity relative",
                                    isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
                                )}
                            >
                                <div className="relative">
                                    <Icon
                                        className="w-5 h-5 text-white"
                                        strokeWidth={2}
                                    />
                                    {item.badge && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#1a36a4]">
                                            {item.badge > 9 ? "9+" : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-white">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
