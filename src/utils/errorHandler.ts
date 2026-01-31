import { FirebaseError } from "firebase/app";

/**
 * Centralized error handling utility
 * Parses Firebase errors and returns user-friendly messages
 */

export interface AppError {
    code: string;
    message: string;
    originalError: Error;
}

/**
 * Parse Firebase errors into user-friendly messages
 */
export function parseFirebaseError(error: unknown): AppError {
    if (error instanceof FirebaseError) {
        const userMessage = getFirebaseErrorMessage(error.code);
        return {
            code: error.code,
            message: userMessage,
            originalError: error,
        };
    }

    if (error instanceof Error) {
        return {
            code: 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            originalError: error,
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        originalError: new Error(String(error)),
    };
}

/**
 * Get user-friendly error messages for Firebase error codes
 */
function getFirebaseErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
        // Auth errors
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'An account already exists with this email',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Check your connection',
        'auth/requires-recent-login': 'Please log in again to continue',

        // Firestore errors
        'permission-denied': 'You don\'t have permission to perform this action',
        'not-found': 'The requested data was not found',
        'already-exists': 'This item already exists',
        'failed-precondition': 'Operation cannot be performed in the current state',
        'aborted': 'Operation was aborted. Please try again',
        'out-of-range': 'Invalid data range',
        'unimplemented': 'This feature is not available yet',
        'internal': 'Internal server error. Please try again',
        'unavailable': 'Service temporarily unavailable. Please try again',
        'data-loss': 'Data loss detected. Please contact support',
        'unauthenticated': 'You must be logged in to perform this action',
        'resource-exhausted': 'Too many requests. Please try again later',
        'cancelled': 'Operation was cancelled',
        'invalid-argument': 'Invalid data provided',
        'deadline-exceeded': 'Operation took too long. Please try again',

        // Storage errors
        'storage/unauthorized': 'You don\'t have permission to access this file',
        'storage/canceled': 'Upload was cancelled',
        'storage/unknown': 'An unknown error occurred during upload',
        'storage/object-not-found': 'File not found',
        'storage/quota-exceeded': 'Storage quota exceeded',
        'storage/unauthenticated': 'You must be logged in to upload files',
        'storage/retry-limit-exceeded': 'Maximum retry time exceeded',
        'storage/invalid-checksum': 'File checksum doesn\'t match',
        'storage/server-file-wrong-size': 'File size doesn\'t match server expectations',
    };

    return errorMessages[code] || 'An error occurred. Please try again';
}

/**
 * Log error to console with context
 */
export function logError(context: string, error: unknown): void {
    const appError = parseFirebaseError(error);
    console.error(`[${context}]`, {
        code: appError.code,
        message: appError.message,
        error: appError.originalError,
    });

    // In production, you could send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
}

/**
 * Handle error with toast notification and logging
 */
export function handleError(
    context: string,
    error: unknown,
    toast?: { error: (title: string, description?: string) => void }
): AppError {
    const appError = parseFirebaseError(error);
    logError(context, error);

    if (toast) {
        toast.error('Error', appError.message);
    }

    return appError;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError!;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof FirebaseError) {
        return error.code === 'auth/network-request-failed' ||
            error.code === 'unavailable' ||
            error.message.toLowerCase().includes('network');
    }

    if (error instanceof Error) {
        return error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('fetch');
    }

    return false;
}
