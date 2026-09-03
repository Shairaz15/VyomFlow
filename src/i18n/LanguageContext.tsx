/**
 * Language Context
 * Provides i18n translation function t(key) and locale management.
 * Reads preferred language from AuthContext (Firestore), defaults to English.
 * Lazy-loads only the active language's JSON file.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { LanguageCode } from '../components/common/OnboardingModal';

type TranslationValue = string | { [key: string]: TranslationValue };
type TranslationMap = Record<string, TranslationValue>;

interface LanguageContextType {
    locale: LanguageCode;
    setLocale: (lang: LanguageCode) => void;
    t: (key: string, vars?: Record<string, string | number>) => string;
    ready: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    setLocale: () => {},
    t: (key) => key,
    ready: false,
});

// Flatten nested JSON: { "landing": { "title": "..." } } → { "landing.title": "..." }
function flattenTranslations(obj: TranslationMap, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
            result[fullKey] = value;
        } else if (typeof value === 'object' && value !== null) {
            Object.assign(result, flattenTranslations(value as TranslationMap, fullKey));
        }
    }
    return result;
}

// Dynamic import map for locale files (11 Core Sarvam AI Languages)
const localeImporters: Record<string, () => Promise<{ default: TranslationMap }>> = {
    en: () => import('./locales/en.json'),
    hi: () => import('./locales/hi.json'),
    bn: () => import('./locales/bn.json'),
    te: () => import('./locales/te.json'),
    mr: () => import('./locales/mr.json'),
    ta: () => import('./locales/ta.json'),
    gu: () => import('./locales/gu.json'),
    kn: () => import('./locales/kn.json'),
    od: () => import('./locales/od.json'),
    or: () => import('./locales/od.json'), // backwards-compatibility alias for Odia
    pa: () => import('./locales/pa.json'),
    ml: () => import('./locales/ml.json'),
};

// Hoisted regex for interpolation (Vercel js-hoist-regexp rule)
const VAR_REGEX = /\{\{([^}]+)\}\}/g;

// Right-To-Left script support check
const RTL_LOCALES = new Set(['ur', 'ks', 'sd']);

// Cache loaded translations via Map for optimized O(1) reads
const translationCache = new Map<string, Record<string, string>>();

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [locale, setLocale] = useState<LanguageCode>(() => {
        return (localStorage.getItem('preferredLanguage') as LanguageCode) || 'en';
    });
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [fallback, setFallback] = useState<Record<string, string>>({});
    const [ready, setReady] = useState(false);

    // Load English fallback on mount
    useEffect(() => {
        localeImporters['en']().then((mod) => {
            const flat = flattenTranslations(mod.default);
            translationCache.set('en', flat);
            setFallback(flat);
            // If locale is English, also set as main translations
            if (locale === 'en') {
                setTranslations(flat);
                setReady(true);
            }
        });
    }, []);

    // Read user's preferred language from Firestore
    useEffect(() => {
        if (!isAuthenticated || !user || !isFirebaseConfigured()) return;

        getDoc(doc(db, 'users', user.uid)).then((snap) => {
            if (snap.exists()) {
                const lang = snap.data()?.preferredLanguage as LanguageCode;
                if (lang && lang !== locale) {
                    setLocale(lang);
                }
            }
        }).catch(() => { /* ignore */ });
    }, [isAuthenticated, user?.uid]);

    // Update localStorage, HTML lang tag, and text direction whenever locale changes
    useEffect(() => {
        localStorage.setItem('preferredLanguage', locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
    }, [locale]);

    // Load translations when locale changes
    useEffect(() => {
        if (locale === 'en') {
            if (translationCache.has('en')) {
                setTranslations(translationCache.get('en')!);
                setReady(true);
            }
            return;
        }

        // Check cache first
        if (translationCache.has(locale)) {
            setTranslations(translationCache.get(locale)!);
            setReady(true);
            return;
        }

        const importer = localeImporters[locale];
        if (!importer) {
            // Unknown locale — fall back to English
            setTranslations(fallback);
            setReady(true);
            return;
        }

        importer().then((mod) => {
            const flat = flattenTranslations(mod.default);
            translationCache.set(locale, flat);
            setTranslations(flat);
            setReady(true);
        }).catch(() => {
            // If loading fails, use English
            setTranslations(fallback);
            setReady(true);
        });
    }, [locale, fallback]);

const DEFAULT_FALLBACKS: Record<string, string> = {
    'dashboard.title': 'Cognitive Health Dashboard',
    'dashboard.subtitle': 'Your personalized multi-modal digital biomarker profile',
    'dashboard.supabaseLive': 'Supabase Live',
    'dashboard.exportReport': 'Export Clinical Report',
    'dashboard.dataControls': 'Data Controls',
    'dashboard.hideControls': 'Hide Controls',
    'dashboard.takeAssessment': 'Take Assessment',
    'dashboard.overallStatus': 'Overall Cognitive Status',
    'dashboard.confidence': 'Confidence: {{val}}%',
    'dashboard.lastAssessment': 'Last Assessment: {{date}}',
    'patientResults.comparedToLastTime': 'Compared to last visit',
    'dashboard.welcomeTitle': 'Welcome to VyomFlow',
    'dashboard.welcomeSubtitle': 'Complete your first cognitive assessment to establish your baseline and generate your digital biomarker profile in Supabase.',
    'dashboard.takeFirstAssessment': 'Take Your First Assessment',
    'dashboard.previewDemo': '🌟 Preview with Demo Dataset',
};

    // Translation function with variable interpolation
    const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
        let text = translations[key] || fallback[key] || DEFAULT_FALLBACKS[key] || key;
        if (vars) {
            text = text.replace(VAR_REGEX, (match, p1) => {
                return vars[p1] !== undefined ? String(vars[p1]) : match;
            });
        }
        return text;
    }, [translations, fallback]);

    const contextValue = useMemo(() => ({ locale, setLocale, t, ready }), [locale, setLocale, t, ready]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
