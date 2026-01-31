import React from 'react';
import { Toaster } from 'sonner';

/**
 * Toast Provider - Wraps the app with toast notification system
 * Uses sonner for beautiful, accessible toast notifications
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{
                    duration: 4000,
                    className: 'font-sans',
                }}
            />
        </>
    );
}
