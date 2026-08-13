import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './db';

const googleProvider = new GoogleAuthProvider();

export const registerUser = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Add display name
        await updateProfile(user, { displayName });

        // Create initial profile in Firestore
        await createUserProfile(user.uid, {
            displayName,
            email,
            photoURL: user.photoURL || null
        });

        return { user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Ensure profile exists in Firestore (creates if not existing)
        await createUserProfile(user.uid, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
        });

        return { user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const subscribeToAuthChanges = (callback) => {
    return onAuthStateChanged(auth, callback);
};
