/**
 * Auth Overlay Component
 * Renders the brand sign-in popup over children when user is not authenticated for test modules.
 * Blocks all pointer interaction with the background content.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { VyomFlowLogo } from './VyomFlowLogo';
import { useLanguage } from '../../i18n/LanguageContext';
import './GoogleSignInModal.css';
import './AuthOverlay.css';

interface AuthOverlayProps {
    children: React.ReactNode;
}

export function AuthOverlay({ children }: AuthOverlayProps) {
    const navigate = useNavigate();
    const { signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);
    const [signInError, setSignInError] = useState<string | null>(null);
    const { t } = useLanguage();

    const handleGoBack = () => {
        navigate('/tests');
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setSignInError(null);
        try {
            await signInWithGoogle();
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            const msg = error?.message || '';
            const code = error?.code || '';
            if (code === 'auth/popup-blocked' || (msg.toLowerCase().includes('popup') && !msg.toLowerCase().includes('closed-by-user'))) {
                setSignInError(t('auth.popupBlocked') || 'Sign-in popup was blocked. Please allow popups for this site and try again.');
            } else if (code === 'auth/popup-closed-by-user' || msg.includes('closed-by-user')) {
                // User closed popup
            } else {
                setSignInError(t('auth.signInFailed') || 'Unable to sign in with Google. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay-wrapper">
            {/* Render children but block interaction */}
            <div className="auth-overlay-background" aria-hidden="true">
                {children}
            </div>

            {/* Overlay Dialog */}
            <div 
                className="vyom-auth-modal-overlay animate-fadeIn" 
                role="dialog" 
                aria-modal="true" 
                aria-labelledby="test-auth-modal-title"
            >
                <div 
                    className="form vyom-auth-card animate-scaleUp"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close / Return Button */}
                    <button 
                        onClick={handleGoBack}
                        className="vyom-auth-close-btn"
                        aria-label="Return to tests"
                        title="Return to tests"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Brand Logo & Header */}
                    <div className="vyom-auth-header">
                        <div className="vyom-auth-logo-wrap">
                            <VyomFlowLogo size="lg" variant="icon" />
                        </div>
                        <h2 id="test-auth-modal-title" className="vyom-auth-title">
                            Sign In Required
                        </h2>
                        <p className="vyom-auth-subtitle">
                            Please sign in with Google to access cognitive assessments and save your progress.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {signInError && (
                        <div className="vyom-auth-error">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{signInError}</span>
                        </div>
                    )}

                    {/* Primary Google Auth Button */}
                    <button 
                        type="button"
                        className="btn vyom-google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="vyom-auth-spinner" />
                        ) : (
                            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
                    </button>

                    {/* Divider */}
                    <p className="p vyom-auth-divider">or</p>

                    {/* Return Action */}
                    <button 
                        type="button"
                        onClick={handleGoBack}
                        className="button-submit vyom-guest-btn"
                    >
                        Return to Cognitive Journey
                    </button>

                    {/* Footer terms */}
                    <p className="p vyom-auth-footer">
                        By continuing, you agree to VyomFlow's <span className="span" onClick={handleGoBack}>Privacy Terms</span> & Data Confidentiality.
                    </p>
                </div>
            </div>
        </div>
    );
}
