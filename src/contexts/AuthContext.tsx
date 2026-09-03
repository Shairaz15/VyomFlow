/**
 * Authentication Context
 * Provides Google OAuth sign-in with role management via Firebase Custom Claims.
 * Roles are read from JWT token claims (not Firestore) for performance and security.
 * Tracks onboarding completion to collect user profile data on first sign-in.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    getIdTokenResult,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';
import { logger } from '../utils/logger';
import type { OnboardingData } from '../components/common/OnboardingModal';

type Role = 'user' | 'admin';

interface AuthContextType {
    user: User | null;
    role: Role;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    onboardingComplete: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshToken: () => Promise<void>;
    completeOnboarding: (data: OnboardingData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<Role>('user');
    const [loading, setLoading] = useState(true);
    const [onboardingComplete, setOnboardingComplete] = useState(true); // default true to avoid flash

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                setUser(firebaseUser);

                if (firebaseUser) {
                    try {
                        // Read admin emails from environment (fallback for local dev)
                        // For production, prefer using Cloud Functions to set admin role via custom claims
                        const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS;
                        const LOCAL_ADMIN_EMAILS = adminEmailsEnv
                            ? adminEmailsEnv.split(',').map((email: string) => email.trim().toLowerCase())
                            : []; // Empty array if not set - rely on custom claims only

                        // Check if user is a local admin (only if env is configured)
                        const isLocalAdmin = LOCAL_ADMIN_EMAILS.length > 0 &&
                            firebaseUser.email &&
                            LOCAL_ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());

                        if (isLocalAdmin) {
                            setRole('admin');
                        } else {
                            // Read role from JWT Custom Claims (NOT Firestore)
                            const tokenResult = await getIdTokenResult(firebaseUser);
                            const claimRole = tokenResult.claims.role as Role;
                            setRole(claimRole || 'user');
                        }

                        // Create/update user profile in Firestore (for preferences, etc.)
                        // Run this in background, don't block the auth flow
                        const userDocRef = doc(db, 'users', firebaseUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        const userData = userDocSnap.exists() ? userDocSnap.data() : null;

                        // Check if onboarding is complete
                        setOnboardingComplete(userData?.onboardingComplete === true);

                        setDoc(
                            userDocRef,
                            {
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName,
                                photoURL: firebaseUser.photoURL,
                                lastActive: serverTimestamp(),
                            },
                            { merge: true }
                        ).catch(err => logger.warn('Failed to update user profile:', err));
                    } catch (error) {
                        logger.error('Error loading user data:', error);
                        setRole('user');
                    }
                } else {
                    setRole('user');
                    setOnboardingComplete(true); // no user = no modal
                }
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!isFirebaseConfigured()) {
            logger.warn('Firebase not configured. Sign-in disabled.');
            return;
        }
        await signInWithPopup(auth, googleProvider);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setRole('user');
        setOnboardingComplete(true);
    };

    const completeOnboarding = async (data: OnboardingData) => {
        if (!user) return;
        await setDoc(
            doc(db, 'users', user.uid),
            {
                age: data.age,
                gender: data.gender,
                preferredLanguage: data.preferredLanguage,
                onboardingComplete: true,
            },
            { merge: true }
        );
        setOnboardingComplete(true);
    };

    // Force token refresh (call after role change via Cloud Function)
    const refreshToken = async () => {
        if (user) {
            await user.getIdToken(true);
            const tokenResult = await getIdTokenResult(user);
            setRole((tokenResult.claims.role as Role) || 'user');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                loading,
                isAuthenticated: !!user,
                isAdmin: role === 'admin',
                onboardingComplete,
                signInWithGoogle,
                signOut,
                refreshToken,
                completeOnboarding,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
