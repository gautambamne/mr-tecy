"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, Loader2, Users, AlertCircle, Mail, Phone } from "lucide-react";
import { userService } from "@/services/user.service";
import { useToast } from "@/hooks/useToast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function AdminUsersPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        userId: string;
        userName: string;
        action: 'promote' | 'demote';
    }>({
        open: false,
        userId: '',
        userName: '',
        action: 'promote'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, "user");
            const snapshot = await getDocs(usersRef);
            const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);

            // Sort: admins first, then partners, then customers
            usersData.sort((a, b) => {
                const roleOrder = { admin: 0, partner: 1, customer: 2 };
                return roleOrder[a.role] - roleOrder[b.role];
            });

            setUsers(usersData);
        } catch (error) {
            console.error("Error loading users:", error);
            toast.error("Failed to load users", "Error loading users from database");
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteToAdmin = (userId: string, userName: string) => {
        setConfirmDialog({
            open: true,
            userId,
            userName,
            action: 'promote'
        });
    };

    const handleRemoveAdmin = (userId: string, userName: string) => {
        setConfirmDialog({
            open: true,
            userId,
            userName,
            action: 'demote'
        });
    };

    const confirmRoleChange = async () => {
        if (!user) return;

        const { userId, action } = confirmDialog;
        const newRole: UserRole = action === 'promote' ? 'admin' : 'customer';

        setProcessingUserId(userId);
        setConfirmDialog({ ...confirmDialog, open: false });

        try {
            const result = await userService.updateUserRole(user.uid, userId, newRole);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || `User role updated to ${newRole}`);
                await loadUsers();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update role");
        } finally {
            setProcessingUserId(null);
        }
    };

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'destructive';
            case 'partner':
                return 'default';
            case 'customer':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    return (
        <div className="min-h-screen pb-12">
            <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 pt-8">
                {/* Header */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            User Management
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Manage user roles and permissions
                        </p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                        <Users className="w-3 h-3 mr-1" />
                        {users.length} Total Users
                    </Badge>
                </div>

                {/* Users List */}
                {loading ? (
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                            <p className="text-sm text-slate-500 mt-3">Loading users...</p>
                        </CardContent>
                    </Card>
                ) : users.length === 0 ? (
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-12 text-center text-slate-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No users found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {users.map((userProfile) => {
                            const isCurrentUser = userProfile.uid === user?.uid;
                            const isProcessing = processingUserId === userProfile.uid;

                            return (
                                <Card key={userProfile.uid} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        {/* User Info */}
                                        <div className="space-y-3">
                                            {/* Name and Role */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-900 text-lg truncate">
                                                            {userProfile.displayName || 'Unknown User'}
                                                        </h3>
                                                        {isCurrentUser && (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs shrink-0">
                                                                You
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        variant={getRoleBadgeVariant(userProfile.role)}
                                                        className="capitalize text-xs"
                                                    >
                                                        {userProfile.role}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Contact Info */}
                                            <div className="space-y-1.5 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="truncate">{userProfile.email}</span>
                                                </div>
                                                {userProfile.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <span>{userProfile.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Self-demote warning */}
                                            {isCurrentUser && userProfile.role === 'admin' && (
                                                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                    <p>You cannot remove your own admin privileges</p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <Separator />
                                            <div className="flex gap-2">
                                                {userProfile.role !== 'admin' && (
                                                    <Button
                                                        onClick={() => handlePromoteToAdmin(userProfile.uid, userProfile.displayName)}
                                                        disabled={isProcessing}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 font-bold shadow-sm"
                                                        size="sm"
                                                    >
                                                        {isProcessing ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Shield className="w-4 h-4 mr-2" />
                                                                Make Admin
                                                            </>
                                                        )}
                                                    </Button>
                                                )}

                                                {userProfile.role === 'admin' && (
                                                    <Button
                                                        onClick={() => handleRemoveAdmin(userProfile.uid, userProfile.displayName)}
                                                        disabled={isCurrentUser || isProcessing}
                                                        variant="outline"
                                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold disabled:opacity-50"
                                                        size="sm"
                                                    >
                                                        {isProcessing ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <ShieldOff className="w-4 h-4 mr-2" />
                                                                Remove Admin
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Info Card */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-5">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="space-y-2 text-sm text-blue-900">
                                <p className="font-bold">Important Notes:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Users must <strong>sign out and sign in</strong> after role changes</li>
                                    <li>You cannot demote yourself</li>
                                    <li>At least one admin must exist</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open: boolean) => setConfirmDialog({ ...confirmDialog, open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog.action === 'promote' ? 'Promote to Admin' : 'Remove Admin Privileges'}
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-2" asChild>
                            <div>
                                {confirmDialog.action === 'promote' ? (
                                    <>
                                        <p>Make <strong>{confirmDialog.userName}</strong> an admin?</p>
                                        <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                                            <p className="font-semibold text-slate-700">They will have access to:</p>
                                            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                                                <li>Manage services</li>
                                                <li>Manage bookings</li>
                                                <li>Approve partners</li>
                                                <li>Manage user roles</li>
                                            </ul>
                                        </div>
                                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                                            <strong>Note:</strong> They must sign out and sign in for changes to take effect.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p>Remove admin privileges from <strong>{confirmDialog.userName}</strong>?</p>
                                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                                            They will be demoted to <strong>customer</strong> role and lose all admin access.
                                        </p>
                                    </>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} className="flex-1 sm:flex-none">
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmRoleChange}
                            className={`flex-1 sm:flex-none ${confirmDialog.action === 'promote' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            {confirmDialog.action === 'promote' ? 'Promote' : 'Remove'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
