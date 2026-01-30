import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    sendEmailVerification,
    User
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, googleProvider, storage } from "@/lib/firebase";

export const authService = {
    // Register with Email, Password, Name, and Profile Photo
    async register(email: string, password: string, name: string, photoFile?: File) {
        try {
            // 1. Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let photoURL = "";

            // 2. Upload photo if provided
            if (photoFile) {
                const storageRef = ref(storage, `profile_photos/${user.uid}`);
                await uploadBytes(storageRef, photoFile);
                photoURL = await getDownloadURL(storageRef);
            }

            // 3. Update profile
            await updateProfile(user, {
                displayName: name,
                photoURL: photoURL || null,
            });

            // 4. Send Verification Email
            await sendEmailVerification(user);

            // 5. Sign out immediately (don't auto-login)
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
    }
};
