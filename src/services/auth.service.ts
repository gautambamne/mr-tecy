import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
    User
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export const authService = {
    // Register with Email, Password, Name
    async register(email: string, password: string, name: string) {
        try {
            // 1. Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update profile
            await updateProfile(user, {
                displayName: name,
                photoURL: null,
            });

            // 3. Send Verification Email
            await sendEmailVerification(user);

            // 4. Sign out immediately (don't auto-login)
            await signOut(auth);

            return user;
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('user already exist. Sign in?');
            }
            throw error;
        }
    },

    // Login with Email and Password
    async login(email: string, password: string) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                await signOut(auth);
                throw new Error("Email not verified");
            }

            return user;
        } catch (error: any) {
            // Re-throw specific verify error
            if (error.message === "Email not verified") {
                throw error;
            }
            // "password and email inceorrect "
            throw new Error("password and email incorrect");
        }
    },

    // Login with Google
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // Google users are automatically verified
            return result.user;
        } catch (error) {
            console.error("Google verify error", error);
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error", error);
            throw error;
        }
    },

    // Reset Password
    async resetPassword(email: string) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Reset password error", error);
            throw error;
        }
    }
};
