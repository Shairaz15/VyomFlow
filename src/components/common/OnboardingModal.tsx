/**
 * Onboarding Modal Component
 * Fullscreen glassmorphism modal shown once after first Google sign-in.
 * Collects age, gender, and preferred language.
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './OnboardingModal.css';

/** 22 Scheduled Languages of India (8th Schedule) + English */
export const INDIAN_LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
    { code: 'mai', label: 'Maithili', native: 'मैथिली' },
    { code: 'sd', label: 'Sindhi', native: 'سنڌي' },
    { code: 'sa', label: 'Sanskrit', native: 'संस्कृतम्' },
    { code: 'ne', label: 'Nepali', native: 'नेपाली' },
    { code: 'kok', label: 'Konkani', native: 'कोंकणी' },
    { code: 'mni', label: 'Manipuri', native: 'মৈতৈলোন্' },
    { code: 'brx', label: 'Bodo', native: 'बड़ो' },
    { code: 'doi', label: 'Dogri', native: 'डोगरी' },
    { code: 'ks', label: 'Kashmiri', native: 'कॉशुर' },
    { code: 'sat', label: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
    { code: 'ur', label: 'Urdu', native: 'اردو' },
] as const;

export const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]['value'];
export type LanguageCode = (typeof INDIAN_LANGUAGES)[number]['code'];

export interface OnboardingData {
    age: number;
    gender: Gender;
    preferredLanguage: LanguageCode;
}

export function OnboardingModal() {
    const { user, onboardingComplete, completeOnboarding } = useAuth();
    const { t } = useLanguage();

    const [age, setAge] = useState('');
    const [gender, setGender] = useState<Gender | ''>('');
    const [language, setLanguage] = useState<LanguageCode>('en');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Don't render if not authenticated or onboarding already done
    if (!user || onboardingComplete) return null;

    const isValid = age !== '' && Number(age) >= 5 && Number(age) <= 120 && gender !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setSubmitting(true);
        setError(null);

        try {
            await completeOnboarding({
                age: Number(age),
                gender: gender as Gender,
                preferredLanguage: language,
            });
        } catch (err) {
            console.error('Onboarding error:', err);
            setError(t('onboarding.error'));
            setSubmitting(false);
        }
    };

    return (
        <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Complete your profile">
            <div className="onboarding-card animate-fadeInUp">
                {/* Header */}
                <div className="onboarding-header">
                    <div className="onboarding-icon">🧠</div>
                    <h2 className="onboarding-title">
                        {t('onboarding.welcomeTitle')} <span className="text-gradient">{t('onboarding.brandName')}</span>
                    </h2>
                    <p className="onboarding-subtitle">
                        {t('onboarding.subtitle')}
                    </p>
                </div>

                {/* Form */}
                <form className="onboarding-form" onSubmit={handleSubmit}>
                    {/* Age */}
                    <div className="onboarding-field">
                        <label htmlFor="onboarding-age" className="onboarding-label">
                            {t('onboarding.age')}
                        </label>
                        <input
                            id="onboarding-age"
                            type="number"
                            className="onboarding-input"
                            placeholder={t('onboarding.agePlaceholder')}
                            min={5}
                            max={120}
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                        />
                    </div>

                    {/* Gender */}
                    <div className="onboarding-field">
                        <label htmlFor="onboarding-gender" className="onboarding-label">
                            {t('onboarding.gender')}
                        </label>
                        <select
                            id="onboarding-gender"
                            className="onboarding-select"
                            value={gender}
                            onChange={(e) => setGender(e.target.value as Gender)}
                            required
                        >
                            <option value="" disabled>
                                {t('onboarding.genderPlaceholder')}
                            </option>
                            {GENDER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {t(`gender.${opt.value}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Preferred Language */}
                    <div className="onboarding-field">
                        <label htmlFor="onboarding-language" className="onboarding-label">
                            {t('onboarding.preferredLanguage')}
                        </label>
                        <select
                            id="onboarding-language"
                            className="onboarding-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                        >
                            {INDIAN_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.native} — {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="onboarding-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary onboarding-submit"
                        disabled={!isValid || submitting}
                    >
                        {submitting ? t('onboarding.saving') : t('onboarding.continue')}
                    </button>
                </form>
            </div>
        </div>
    );
}
