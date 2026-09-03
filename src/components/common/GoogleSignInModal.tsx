import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleSignInButton } from './GoogleSignInButton';
import { VyomFlowLogo } from './VyomFlowLogo';
import { useLanguage } from '../../i18n/LanguageContext';
import './GoogleSignInModal.css';

interface GoogleSignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function GoogleSignInModal({ isOpen, onClose, onSuccess }: GoogleSignInModalProps) {
    const { t } = useLanguage();
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

    const handleSignInSuccess = () => {
        setAuthError(null);
        if (onSuccess) {
            onSuccess();
        } else {
            onClose();
        }
    };

    const handleSignInError = (error: Error) => {
        if (error.message.includes('popup')) {
            setAuthError(t('auth.popupBlocked') || 'Sign-in popup was blocked. Please allow popups.');
        } else {
            setAuthError(t('auth.signInFailed') || 'Unable to sign in with Google. Please try again.');
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
            <div 
                className="vyom-auth-modal-card animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="vyom-auth-modal-close"
                    aria-label="Close sign in dialog"
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
                <h2 id="auth-modal-title" className="vyom-auth-modal-title">
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
                {authError && (
                    <div className="vyom-auth-modal-error">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{authError}</span>
                    </div>
                )}

                {/* Action Controls */}
                <div className="vyom-auth-modal-actions">
                    <GoogleSignInButton 
                        onSuccess={handleSignInSuccess}
                        onError={handleSignInError}
                    />

                    <button 
                        onClick={onClose}
                        className="vyom-auth-modal-guest-btn"
                    >
                        Explore Platform as Guest
                    </button>
                </div>

                <div className="vyom-auth-modal-footer">
                    <span>By continuing, you agree to VyomFlow's privacy terms & data confidentiality.</span>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
