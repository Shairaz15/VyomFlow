/**
 * Settings Page
 * User preferences, profile management, and email notifications.
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { PageWrapper } from '../components/layout/PageWrapper';
import { sendWeeklyReminder, isEmailConfigured, saveEmailPreferences, getEmailPreferences } from '../services/emailService';
import { INDIAN_LANGUAGES, GENDER_OPTIONS } from '../components/common/OnboardingModal';
import type { Gender, LanguageCode } from '../components/common/OnboardingModal';
import { useLanguage } from '../i18n/LanguageContext';
import { clearAllTestData } from '../hooks/useTestResults';
import './Settings.css';

interface UserPreferences {
    emailNotifications: boolean;
    lastReminderSent?: Date;
}

export function Settings() {
    const { user, isAdmin } = useAuth();
    const { t, setLocale } = useLanguage();
    const [preferences, setPreferences] = useState<UserPreferences>({
        emailNotifications: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const emailConfigured = isEmailConfigured();

    // Profile fields
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<Gender | ''>('');
    const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en');
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadPreferences = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const fetchedEmailNotifications = data.preferences?.emailNotifications ?? true;
                    setPreferences({
                        emailNotifications: fetchedEmailNotifications,
                        lastReminderSent: data.preferences?.lastReminderSent?.toDate(),
                    });
                    // Also sync with localStorage for the email service
                    const localPrefs = getEmailPreferences();
                    if (user.email && !localPrefs.email) {
                        saveEmailPreferences(fetchedEmailNotifications, user.email);
                    }
                    // Load profile fields
                    if (data.age) setAge(String(data.age));
                    if (data.gender) setGender(data.gender);
                    if (data.preferredLanguage) setPreferredLanguage(data.preferredLanguage);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [user]);

    const handleToggleNotifications = async (enabled: boolean) => {
        if (!user) return;

        setSaving(true);
        setMessage(null);

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                'preferences.emailNotifications': enabled,
                'preferences.updatedAt': serverTimestamp(),
            });
            setPreferences((prev) => ({ ...prev, emailNotifications: enabled }));
            // Sync with localStorage for the email service
            saveEmailPreferences(enabled, user.email || '');
            setMessage({ type: 'success', text: t('settings.prefsSaved') });
        } catch (error) {
            console.error('Error saving preferences:', error);
            setMessage({ type: 'error', text: t('settings.prefsFailed') });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSavingProfile(true);
        setMessage(null);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                age: age ? Number(age) : null,
                gender: gender || null,
                preferredLanguage,
                'preferences.updatedAt': serverTimestamp(),
            });
            setLocale(preferredLanguage);
            localStorage.setItem('preferredLanguage', preferredLanguage);
            try {
                const existing = localStorage.getItem('vyomflow_user_profile');
                const parsed = existing ? JSON.parse(existing) : {};
                if (age) parsed.age = Number(age);
                if (gender) parsed.gender = gender;
                parsed.preferredLanguage = preferredLanguage;
                localStorage.setItem('vyomflow_user_profile', JSON.stringify(parsed));
            } catch {}
            setMessage({ type: 'success', text: t('settings.profileUpdated') });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: t('settings.profileFailed') });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCleanSlate = async () => {
        if (window.confirm("Are you sure you want to clear all local browser test data and session cache?")) {
            await clearAllTestData();
            localStorage.removeItem('vyomflow_supabase_offline_queue');
            setMessage({ type: 'success', text: 'Clean slate activated! All local session records cleared.' });
        }
    };

    const handleSendTestEmail = async () => {
        if (!user?.email) {
            setMessage({ type: 'error', text: t('settings.noEmailFound') });
            return;
        }

        if (!emailConfigured) {
            setMessage({ type: 'info', text: t('settings.emailjsNotConfigured') });
            return;
        }

        setSendingTest(true);
        setMessage(null);

        try {
            const success = await sendWeeklyReminder({
                toName: user.displayName || 'User',
                toEmail: user.email,
                daysSinceLastAssessment: 7,
            });

            if (success) {
                setMessage({ type: 'success', text: t('settings.testEmailSent') });
            } else {
                setMessage({ type: 'error', text: t('settings.testEmailFailed') });
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            setMessage({ type: 'error', text: 'Failed to send email' });
        } finally {
            setSendingTest(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper>
                <div className="settings-loading">{t('settings.loadingSettings')}</div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="settings-page">
                <header className="settings-header">
                    <h1>{t('settings.title')}</h1>
                    <p>{t('settings.subtitle')}</p>
                </header>

                <section className="settings-section">
                    <h2>{t('settings.account')}</h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">{t('settings.email')}</span>
                            <span className="setting-value">{user?.email}</span>
                        </div>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">{t('settings.displayName')}</span>
                            <span className="setting-value">{user?.displayName || t('settings.notSet')}</span>
                        </div>
                    </div>
                </section>

                <section className="settings-section">
                    <h2>{t('settings.profile')}</h2>
                    <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                            <span className="setting-label">{t('settings.age')}</span>
                        </div>
                        <input
                            type="number"
                            className="settings-input"
                            placeholder={t('settings.agePlaceholder')}
                            min={5}
                            max={120}
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />
                    </div>
                    <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                            <span className="setting-label">{t('settings.gender')}</span>
                        </div>
                        <select
                            className="settings-select"
                            value={gender}
                            onChange={(e) => setGender(e.target.value as Gender)}
                        >
                            <option value="" disabled>{t('settings.genderPlaceholder')}</option>
                            {GENDER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{t(`gender.${opt.value}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="setting-item setting-item-vertical">
                        <div className="setting-info">
                            <span className="setting-label">{t('settings.preferredLanguage')}</span>
                        </div>
                        <select
                            className="settings-select"
                            value={preferredLanguage}
                            onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                        >
                            {INDIAN_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.native} — {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary btn-sm settings-save-btn"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                    >
                        {savingProfile ? t('settings.saving') : t('settings.saveProfile')}
                    </button>
                </section>

                <section className="settings-section">
                    <h2>{t('settings.emailNotifications')}</h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">{t('settings.weeklyReminder')}</span>
                            <span className="setting-description">
                                {t('settings.weeklyReminderDesc')}
                            </span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications}
                                onChange={(e) => handleToggleNotifications(e.target.checked)}
                                disabled={saving}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    {!emailConfigured && (
                        <div className="setting-notice">
                            <span className="notice-icon">⚠️</span>
                            <span>{t('settings.emailNotConfigured')}</span>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-label">{t('settings.testEmail')}</span>
                                <span className="setting-description">
                                    {t('settings.testEmailDesc')}
                                </span>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleSendTestEmail}
                                disabled={sendingTest || !preferences.emailNotifications}
                            >
                                {sendingTest ? t('settings.sendingTest') : t('settings.sendTest')}
                            </button>
                        </div>
                    )}

                    {preferences.lastReminderSent && (
                        <p className="last-reminder-info">
                            {t('settings.lastReminderSent', { date: preferences.lastReminderSent.toLocaleDateString() })}
                        </p>
                    )}
                </section>

                <section className="settings-section">
                    <h2>{t('settings.dataSessionStorage')}</h2>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">{t('settings.resetLocalCache')}</span>
                            <span className="setting-description">
                                {t('settings.resetCacheDesc')}
                            </span>
                        </div>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleCleanSlate}
                            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                        >
                            {t('settings.clearLocalData')}
                        </button>
                    </div>
                </section>

                {message && (
                    <div className={`settings-message ${message.type}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}

