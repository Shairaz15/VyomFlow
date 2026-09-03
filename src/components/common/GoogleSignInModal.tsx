import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './GoogleSignInModal.css';

interface GoogleSignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function GoogleSignInModal({ isOpen, onClose, onSuccess }: GoogleSignInModalProps) {
    const { signInWithGoogle } = useAuth();
    const { t } = useLanguage();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setAuthError(null);
        try {
            await signInWithGoogle();
            if (onSuccess) {
                onSuccess();
            } else {
                onClose();
            }
        } catch (err: unknown) {
            const error = err as Error;
            const msg = error?.message || '';
            if (msg.includes('popup')) {
                setAuthError(t('auth.popupBlocked') || 'Sign-in popup was blocked. Please allow popups.');
            } else {
                setAuthError(t('auth.signInFailed') || 'Unable to sign in with Google. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAppleSignIn = () => {
        // Direct users to Google OAuth as primary verified provider
        handleGoogleSignIn();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // If email provided, use Google OAuth as primary platform authentication
        handleGoogleSignIn();
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
                    <label>Email </label>
                </div>
                <div className="inputForm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 32 32" height="20">
                        <g>
                            <path d="M16 3C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3zm0 2c6.086 0 11 4.914 11 11s-4.914 11-11 11S5 22.086 5 16 9.914 5 16 5zm0 4a7 7 0 0 0-7 7 7 7 0 0 0 7 7 6.98 6.98 0 0 0 5.61-2.828l-1.584-1.226A4.985 4.985 0 0 1 16 21a5 5 0 0 1-5-5 5 5 0 0 1 5-5c2.43 0 4.453 1.762 4.908 4.094A2.008 2.008 0 0 1 18.5 18a1.5 1.5 0 0 1-1.5-1.5V11h-2v5.5a3.5 3.5 0 0 0 5.438 2.922C21.436 18.422 22 17.273 22 16c0-3.86-3.14-7-7-7z" fill="currentColor" />
                        </g>
                    </svg>
                    <input 
                        type="email" 
                        className="input" 
                        placeholder="Enter your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                
                {/* Password Field */}
                <div className="flex-column">
                    <label>Password </label>
                </div>
                <div className="inputForm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 -960 960 960" height="20" fill="currentColor">
                        <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240zm240-200q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280zM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80z" />
                    </svg>
                    <input 
                        type="password" 
                        className="input" 
                        placeholder="Enter your Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                {/* Remember Me & Forgot Password */}
                <div className="flex-row">
                    <div>
                        <input 
                            type="checkbox" 
                            id="remember-me"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="remember-me">Remember me </label>
                    </div>
                    <span 
                        className="span"
                        onClick={() => handleGoogleSignIn()}
                    >
                        Forgot password?
                    </span>
                </div>

                {/* Error Banner */}
                {authError && (
                    <div className="vyom-auth-error">
                        <span>{authError}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button 
                    type="submit" 
                    className="button-submit"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>

                {/* Switch Sign in / Sign up */}
                <p className="p line">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <span 
                        className="span" 
                        onClick={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </span>
                </p>

                {/* Divider */}
                <p className="p">Or With</p>

                {/* Google & Apple Buttons */}
                <div className="flex-row" style={{ gap: '12px' }}>
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
                        Google
                    </button>
                    <button 
                        type="button" 
                        className="btn apple"
                        onClick={handleAppleSignIn}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.59.69-1.11 1.82-.97 2.91 1.07.08 2.12-.51 2.78-1.31z"/>
                        </svg>
                        Apple
                    </button>
                </div>
            </form>
        </div>
    );

    return createPortal(modalContent, document.body);
}
