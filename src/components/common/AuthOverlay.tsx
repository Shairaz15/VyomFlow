/**
 * Auth Overlay Component
 * Renders the brand sign-in popup over children when user is not authenticated for test modules.
 * Blocks all pointer interaction with the background content.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from './GoogleSignInButton';
import { VyomFlowLogo } from './VyomFlowLogo';
import { useLanguage } from '../../i18n/LanguageContext';
import './GoogleSignInModal.css';
import './AuthOverlay.css';

interface AuthOverlayProps {
    children: React.ReactNode;
}

export function AuthOverlay({ children }: AuthOverlayProps) {
    const navigate = useNavigate();
    const [signInError, setSignInError] = useState<string | null>(null);
    const { t } = useLanguage();

    const handleGoBack = () => {
        navigate('/tests');
    };

    const handleSignInError = (error: Error) => {
        if (error.message.includes('popup')) {
            setSignInError(t('auth.popupBlocked') || 'Sign-in popup was blocked. Please allow popups.');
        } else {
            setSignInError(t('auth.signInFailed') || 'Unable to sign in with Google. Please try again.');
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
                    className="vyom-auth-modal-card animate-scaleUp"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close / Return Button */}
                    <button 
                        onClick={handleGoBack}
                        className="vyom-auth-modal-close"
                        aria-label="Return to tests"
                        title="Return to tests"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Brand / Visual Icon Header */}
                    <div className="vyom-auth-modal-icon-wrapper">
                        <div className="vyom-auth-modal-icon-glow" />
                        <div className="vyom-auth-modal-icon !bg-transparent !border-none !shadow-none">
                            <VyomFlowLogo size="lg" variant="icon" />
                        </div>
                    </div>

                    {/* Header Text */}
                    <h2 id="test-auth-modal-title" className="vyom-auth-modal-title">
                        Welcome to VyomFlow
                    </h2>
                    <p className="vyom-auth-modal-subtitle">
                        Sign in with Google to synchronize your cognitive tests, unlock longitudinal biomarker analytics, and track your brain health journey.
                    </p>

                    {/* Feature Highlights */}
                    <div className="vyom-auth-modal-features">
                        <div className="vyom-auth-feature-item">
                            <span className="vyom-auth-feature-icon">🧭</span>
                            <div className="text-left">
                                <span className="vyom-auth-feature-title">7-Domain Cognitive Battery</span>
                                <span className="vyom-auth-feature-desc">Story, memory, reaction, pattern, attention & navigation</span>
                            </div>
                        </div>
                        <div className="vyom-auth-feature-item">
                            <span className="vyom-auth-feature-icon">📊</span>
                            <div className="text-left">
                                <span className="vyom-auth-feature-title">Longitudinal AI Biomarkers</span>
                                <span className="vyom-auth-feature-desc">Interactive radar charts, trend curves & clinical indicators</span>
                            </div>
                        </div>
                        <div className="vyom-auth-feature-item">
                            <span className="vyom-auth-feature-icon">☁️</span>
                            <div className="text-left">
                                <span className="vyom-auth-feature-title">Encrypted Cloud Sync</span>
                                <span className="vyom-auth-feature-desc">Access your journey and test history securely on any device</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {signInError && (
                        <div className="vyom-auth-modal-error">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{signInError}</span>
                        </div>
                    )}

                    {/* Action Controls */}
                    <div className="vyom-auth-modal-actions">
                        <GoogleSignInButton onError={handleSignInError} />

                        <button 
                            onClick={handleGoBack}
                            className="vyom-auth-modal-guest-btn"
                        >
                            Return to Cognitive Journey
                        </button>
                    </div>

                    <div className="vyom-auth-modal-footer">
                        <span>By continuing, you agree to VyomFlow's privacy terms & data confidentiality.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
