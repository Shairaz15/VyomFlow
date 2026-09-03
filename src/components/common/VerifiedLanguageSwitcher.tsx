import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { LanguageCode } from './OnboardingModal';

export interface SupportedLanguage {
    code: LanguageCode;
    name: string;
    nativeName: string;
    flag: string;
}

/**
 * Registry of verified translated languages.
 * Currently initialized with English & Hindi (verified translations present in locales/en.json & locales/hi.json).
 * Additional Indic languages can be added to this array as verified translations are ready.
 */
export const VERIFIED_LANGUAGES: SupportedLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
];

export function VerifiedLanguageSwitcher() {
    const { locale, setLocale } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLang = VERIFIED_LANGUAGES.find(l => l.code === locale) || VERIFIED_LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectLanguage = (code: LanguageCode) => {
        setLocale(code);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200"
                style={{
                    backgroundColor: 'rgba(23, 50, 77, 0.05)',
                    color: '#17324D',
                    border: '1px solid rgba(23, 50, 77, 0.15)',
                }}
                aria-label="Select Language"
                aria-expanded={isOpen}
            >
                <span className="text-sm">{currentLang.flag}</span>
                <span>{currentLang.nativeName}</span>
                <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border backdrop-blur-md z-50 overflow-hidden py-1 transition-all duration-200 animate-fadeIn"
                    style={{
                        backgroundColor: '#F7F4EC',
                        borderColor: 'rgba(23, 50, 77, 0.15)',
                        boxShadow: '0 10px 25px -5px rgba(23, 50, 77, 0.15)',
                    }}
                >
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-muted" style={{ color: '#4F7C78' }}>
                        Supported Languages
                    </div>
                    {VERIFIED_LANGUAGES.map((lang) => {
                        const isSelected = lang.code === locale;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => handleSelectLanguage(lang.code)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors duration-150 ${
                                    isSelected ? 'font-bold' : 'hover:bg-black/5 font-normal'
                                }`}
                                style={{
                                    color: '#17324D',
                                    backgroundColor: isSelected ? 'rgba(143, 175, 139, 0.2)' : 'transparent',
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-base">{lang.flag}</span>
                                    <span>{lang.nativeName}</span>
                                    {lang.name !== lang.nativeName && (
                                        <span className="text-[10px] opacity-60">({lang.name})</span>
                                    )}
                                </span>
                                {isSelected && (
                                    <svg className="w-4 h-4 text-emerald-600" style={{ color: '#5F8F6B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
