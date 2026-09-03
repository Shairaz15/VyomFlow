import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './GoogleSignInModal.css';

interface GoogleSignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialMode?: 'signin' | 'signup';
}

function formatAuthErrorMessage(err: unknown, defaultMessage: string): string | null {
    const error = err as { code?: string; message?: string };
    const code = error?.code || '';
    const rawMsg = error?.message || '';

    switch (code) {
        case 'auth/operation-not-allowed':
            return 'Email/Password sign-in is not enabled in Firebase Console. Please sign in with Google or enable Email/Password in your Firebase project settings.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Please sign in instead.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
            return 'Incorrect email or password.';
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/user-disabled':
            return 'This user account has been disabled.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection and try again.';
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked. Please allow popups for this site and try again.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return null;
        case 'auth/account-exists-with-different-credential':
            return 'An account already exists with this email using a different sign-in method (e.g. Google).';
        default: {
            if (rawMsg.includes('auth/operation-not-allowed') || rawMsg.includes('operation-not-allowed')) {
                return 'Email/Password sign-in is not enabled in Firebase Console. Please sign in with Google or enable Email/Password in your Firebase project settings.';
            }
            if (rawMsg.includes('popup') && !rawMsg.includes('closed-by-user')) {
                return 'Sign-in popup was blocked. Please allow popups for this site and try again.';
            }
            if (rawMsg.includes('closed-by-user')) {
                return null;
            }
            // Strip any raw "Firebase: Error (auth/...)" prefix
            const cleanMsg = rawMsg.replace(/^Firebase:\s*Error\s*\([a-zA-Z0-9\/-]+\)\.?\s*/i, '').trim();
            return cleanMsg || defaultMessage;
        }
    }
}

export function GoogleSignInModal({ isOpen, onClose, onSuccess, initialMode = 'signin' }: GoogleSignInModalProps) {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
    const { t } = useLanguage();
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Reset form state cleanly when modal opens or mode prop changes
    useEffect(() => {
        if (isOpen) {
            setIsSignUp(initialMode === 'signup');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            setShowConfirmPassword(false);
            setAuthError(null);
            setSuccessMessage(null);
            setLoading(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, initialMode, onClose]);

    if (!isOpen) return null;

    const handleSwitchMode = (targetSignUp: boolean) => {
        setIsSignUp(targetSignUp);
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setAuthError(null);
        setSuccessMessage(null);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setAuthError(null);
        setSuccessMessage(null);
        try {
            await signInWithGoogle();
            if (onSuccess) {
                onSuccess();
            } else {
                onClose();
            }
        } catch (err: unknown) {
            const formatted = formatAuthErrorMessage(err, t('auth.signInFailed') || 'Unable to sign in with Google. Please try again.');
            if (formatted) {
                setAuthError(formatted);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setAuthError(null);
        setSuccessMessage(null);
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setAuthError('Please enter your email address to reset your password.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setAuthError('Please enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            await sendPasswordReset(trimmedEmail);
            setSuccessMessage('Password reset email sent! Check your inbox.');
        } catch (err: unknown) {
            const formatted = formatAuthErrorMessage(err, 'Failed to send password reset email.');
            if (formatted) {
                setAuthError(formatted);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setSuccessMessage(null);

        const trimmedEmail = email.trim();

        // Validate Email
        if (!trimmedEmail) {
            setAuthError('Please enter your email address.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setAuthError('Please enter a valid email address.');
            return;
        }

        // Validate Password
        if (!password) {
            setAuthError('Please enter your password.');
            return;
        }

        if (isSignUp) {
            // Sign Up specific validation
            if (password.length < 6) {
                setAuthError('Password should be at least 6 characters.');
                return;
            }
            if (!confirmPassword) {
                setAuthError('Please confirm your password.');
                return;
            }
            if (password !== confirmPassword) {
                setAuthError('Passwords do not match.');
                return;
            }

            setLoading(true);
            try {
                await signUpWithEmail(trimmedEmail, password);
                if (onSuccess) {
                    onSuccess();
                } else {
                    onClose();
                }
            } catch (err: unknown) {
                const formatted = formatAuthErrorMessage(err, 'Unable to sign up. Please try again.');
                if (formatted) {
                    setAuthError(formatted);
                }
            } finally {
                setLoading(false);
            }
        } else {
            // Sign In
            setLoading(true);
            try {
                await signInWithEmail(trimmedEmail, password);
                if (onSuccess) {
                    onSuccess();
                } else {
                    onClose();
                }
            } catch (err: unknown) {
                const formatted = formatAuthErrorMessage(err, 'Unable to sign in. Please try again.');
                if (formatted) {
                    setAuthError(formatted);
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div 
            className="vyom-auth-modal-overlay animate-fadeIn"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
        >
            <form 
                className="form animate-scaleUp"
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    type="button"
                    onClick={onClose}
                    className="vyom-auth-close-btn"
                    aria-label="Close dialog"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Email Field */}
                <div className="flex-column">
                    <label htmlFor="auth-email">Email</label>
                </div>
                <div className="inputForm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 32 32" height="20" fill="currentColor">
                        <path d="M16 3C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3zm0 2c6.086 0 11 4.914 11 11s-4.914 11-11 11S5 22.086 5 16 9.914 5 16 5zm0 4a7 7 0 0 0-7 7 7 7 0 0 0 7 7 6.98 6.98 0 0 0 5.61-2.828l-1.584-1.226A4.985 4.985 0 0 1 16 21a5 5 0 0 1-5-5 5 5 0 0 1 5-5c2.43 0 4.453 1.762 4.908 4.094A2.008 2.008 0 0 1 18.5 18a1.5 1.5 0 0 1-1.5-1.5V11h-2v5.5a3.5 3.5 0 0 0 5.438 2.922C21.436 18.422 22 17.273 22 16c0-3.86-3.14-7-7-7z" />
                    </svg>
                    <input 
                        id="auth-email"
                        type="email" 
                        className="input" 
                        placeholder="Enter your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </div>
                
                {/* Password Field */}
                <div className="flex-column">
                    <label htmlFor="auth-password">Password</label>
                </div>
                <div className="inputForm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 -960 960 960" height="20" fill="currentColor">
                        <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280zM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80z" />
                    </svg>
                    <input 
                        id="auth-password"
                        type={showPassword ? "text" : "password"} 
                        className="input" 
                        placeholder="Enter your Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                    />
                    <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                <line x1="2" x2="22" y1="2" y2="22" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Confirm Password Field (Sign Up Only) */}
                {isSignUp && (
                    <>
                        <div className="flex-column">
                            <label htmlFor="auth-confirm-password">Confirm Password</label>
                        </div>
                        <div className="inputForm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 -960 960 960" height="20" fill="currentColor">
                                <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280zM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80z" />
                            </svg>
                            <input 
                                id="auth-confirm-password"
                                type={showConfirmPassword ? "text" : "password"} 
                                className="input" 
                                placeholder="Confirm your Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" x2="22" y1="2" y2="22" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </>
                )}
                
                {/* Remember Me & Forgot Password (Sign In Only) */}
                {!isSignUp && (
                    <div className="flex-row">
                        <div>
                            <input 
                                type="checkbox" 
                                id="remember-me"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember-me">Remember me</label>
                        </div>
                        <span 
                            className="span"
                            onClick={handleForgotPassword}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleForgotPassword(); }}
                        >
                            Forgot password?
                        </span>
                    </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                    <div className="vyom-auth-success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Error Banner */}
                {authError && (
                    <div className="vyom-auth-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{authError}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button 
                    type="submit" 
                    className="button-submit"
                    disabled={loading}
                >
                    {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>

                {/* Switch Sign in / Sign up */}
                <p className="p line">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <span 
                        className="span" 
                        onClick={() => handleSwitchMode(!isSignUp)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSwitchMode(!isSignUp); }}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </span>
                </p>

                {/* Divider */}
                <p className="p">Or With</p>

                {/* Google Authentication Button (Full Width, Apple Removed) */}
                <div className="google-auth-container">
                    <button 
                        type="button" 
                        className="btn google"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
                    </button>
                </div>
            </form>
        </div>
    );

    return createPortal(modalContent, document.body);
}
