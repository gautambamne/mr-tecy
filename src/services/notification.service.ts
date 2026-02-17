import { db, messaging } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    arrayUnion
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { Notification as NotificationModel, NotificationType } from "@/types";

export const notificationService = {
    // Request permission and save token
    async requestPermission(userId: string) {
        if (!messaging) return;

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // Add this to env
                });

                if (token) {
                    await this.saveToken(userId, token);
                    console.log("FCM Token saved:", token);
                }
            }
        } catch (error) {
            console.error("Error asking for permission:", error);
        }
    },

    async saveToken(userId: string, token: string) {
        try {
            const userRef = doc(db, "user", userId);
            await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
            });
        } catch (error) {
            console.error("Error saving FCM token:", error);
        }
    },

    // Create notification (In-app + Push)
    async createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type: NotificationType;
        link?: string;
    }) {
        try {
            // 1. Save to Firestore for in-app history
            await addDoc(collection(db, "notifications"), {
                ...data,
                read: false,
                createdAt: serverTimestamp()
            });

            // 2. Send Push Notification via Server Action/API
            await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    link: data.link
                })
            });

        } catch (error) {
            console.error("Error creating notification:", error);
        }
    },

    // Subscribe to in-app notifications
    subscribeToNotifications(userId: string, callback: (notifications: NotificationModel[]) => void) {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as NotificationModel));
            callback(notifications);
        });
    },

    async markAsRead(notificationId: string) {
        try {
            await updateDoc(doc(db, "notifications", notificationId), {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    },

    // Foreground message listener
    onMessageListener() {
        if (!messaging) return new Promise(() => { });
        return new Promise((resolve) => {
            onMessage(messaging!, (payload) => {
                resolve(payload);
            });
        });
    }
};
