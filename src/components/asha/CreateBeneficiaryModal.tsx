import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAsha } from '../../contexts/AshaContext';
import { INDIAN_LANGUAGES, GENDER_OPTIONS } from '../common/OnboardingModal';
import './AshaComponents.css';

interface CreateBeneficiaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (name: string) => void;
}

export function CreateBeneficiaryModal({ isOpen, onClose, onCreated }: CreateBeneficiaryModalProps) {
    const { registerBeneficiary } = useAsha();
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [educationYears, setEducationYears] = useState('6');
    const [language, setLanguage] = useState('hi');
    const [gender, setGender] = useState('female');
    const [villageName, setVillageName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName.trim()) {
            setError('Please enter the beneficiary\'s full name.');
            return;
        }

        const parsedAge = parseInt(age, 10);
        if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 115) {
            setError('Please enter a valid age (10 - 115 years).');
            return;
        }

        const parsedEdu = parseInt(educationYears, 10);
        if (isNaN(parsedEdu) || parsedEdu < 0 || parsedEdu > 30) {
            setError('Please enter valid years of schooling (0 - 30 years).');
            return;
        }

        setSubmitting(true);
        try {
            const beneficiary = await registerBeneficiary({
                full_name: fullName.trim(),
                age: parsedAge,
                education_years: parsedEdu,
                preferred_language: language,
                gender,
                village_name: villageName.trim() || 'Village Unit'
            });

            if (onCreated) {
                onCreated(beneficiary.full_name);
            }
            onClose();
            // Reset fields
            setFullName('');
            setAge('');
            setEducationYears('6');
            setVillageName('');
        } catch (err: any) {
            setError(err.message || 'Failed to register beneficiary. Please retry.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="asha-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="asha-modal-card" onClick={e => e.stopPropagation()}>
                <div className="asha-modal-header">
                    <div className="asha-header-icon-badge">
                        <span className="asha-badge-emoji">👥</span>
                    </div>
                    <div>
                        <h2 className="asha-modal-title">Register Village Beneficiary</h2>
                        <p className="asha-modal-subtitle">
                            Create a localized assessment profile without needing an email or smartphone.
                        </p>
                    </div>
                    <button className="asha-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {error && (
                    <div className="asha-modal-alert asha-modal-alert-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="asha-modal-form">
                    <div className="asha-form-group">
                        <label className="asha-form-label">Full Name *</label>
                        <input
                            type="text"
                            className="asha-form-input"
                            placeholder="e.g. Ramesh Kumar / Lakshmi Devi"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="asha-form-row">
                        <div className="asha-form-group">
                            <label className="asha-form-label">Age (years) *</label>
                            <input
                                type="number"
                                className="asha-form-input"
                                placeholder="e.g. 62"
                                min="10"
                                max="115"
                                value={age}
                                onChange={e => setAge(e.target.value)}
                                required
                            />
                        </div>

                        <div className="asha-form-group">
                            <label className="asha-form-label">
                                Years of Education *
                                <span className="asha-form-hint"> (Used for MoCA norming)</span>
                            </label>
                            <input
                                type="number"
                                className="asha-form-input"
                                placeholder="e.g. 5"
                                min="0"
                                max="25"
                                value={educationYears}
                                onChange={e => setEducationYears(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="asha-form-group">
                        <label className="asha-form-label">Preferred Spoken Language *</label>
                        <div className="asha-language-grid">
                            {INDIAN_LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    className={`asha-lang-chip ${language === lang.code ? 'active' : ''}`}
                                    onClick={() => setLanguage(lang.code)}
                                >
                                    <span className="asha-chip-native">{lang.native}</span>
                                    <span className="asha-chip-label">{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="asha-form-row">
                        <div className="asha-form-group">
                            <label className="asha-form-label">Gender</label>
                            <select
                                className="asha-form-select"
                                value={gender}
                                onChange={e => setGender(e.target.value)}
                            >
                                {GENDER_OPTIONS.map(g => (
                                    <option key={g.value} value={g.value}>{g.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="asha-form-group">
                            <label className="asha-form-label">Village / Ward Area</label>
                            <input
                                type="text"
                                className="asha-form-input"
                                placeholder="e.g. Rampur Sector 4"
                                value={villageName}
                                onChange={e => setVillageName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="asha-modal-actions">
                        <button
                            type="button"
                            className="asha-btn asha-btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="asha-btn asha-btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Creating Profile...' : 'Save & Add to Field List'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
