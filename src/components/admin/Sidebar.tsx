"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Wrench,
    Users,
    Calendar,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Logo } from "@/components/Logo";

interface SidebarProps {
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ className, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [collapsed, setCollapsed] = useState(false);

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/services", label: "Services", icon: Wrench },
        { href: "/admin/partners", label: "Partners", icon: Users },
        { href: "/admin/bookings", label: "Bookings", icon: Calendar },
        { href: "/admin/users", label: "Users", icon: UserCog },
    ];

    // Mobile Sidebar
    if (!isDesktop) {
        return (
            <>
                {/* Backdrop */}
                {isOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}

                {/* Mobile Drawer */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
                        isOpen ? "translate-x-0" : "-translate-x-full",
                        className
                    )}
                >
                    <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <Logo showText={false} />
                                    <div>
                                        <span className="font-bold text-lg text-[#1e40af] tracking-tight leading-none block">mrtecy</span>
                                        <p className="text-xs text-slate-500 font-medium">Admin Panel</p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <link.icon className="h-5 w-5 flex-shrink-0" />
                                        <span>{link.label}</span>
                                        {isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer */}
                        <div className="p-3 border-t space-y-1">
                            <Link
                                href="/"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    "text-red-600 hover:bg-red-50"
                                )}
                            >
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                <span>Back to App</span>
                            </Link>
                        </div>
                    </div>
                </aside>
            </>
        );
    }

    // Desktop Sidebar
    return (
        <aside
            className={cn(
                "hidden lg:flex bg-white border-r h-screen flex-col transition-all duration-300 sticky top-0",
                collapsed ? "w-16" : "w-64",
                className
            )}
        >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Logo showText={false} />
                            <div>
                                <span className="font-bold text-lg text-[#1e40af] tracking-tight leading-none block">mrtecy</span>
                                <p className="text-xs text-slate-500 font-medium">Admin Panel</p>
                            </div>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-8 w-8 p-0"
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                            title={collapsed ? link.label : undefined}
                        >
                            <link.icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{link.label}</span>}
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t space-y-1">
                <Link
                    href="/"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        "text-red-600 hover:bg-red-50"
                    )}
                    title={collapsed ? "Back to App" : undefined}
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>Back to App</span>}
                </Link>
            </div>
        </aside>
    );
}
