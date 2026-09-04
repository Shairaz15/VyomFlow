import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAsha } from '../../contexts/AshaContext';
import { INDIAN_LANGUAGES, GENDER_OPTIONS } from '../common/OnboardingModal';
import type { AshaBeneficiary } from '../../services/supabaseService';
import { UserCheck, X, AlertCircle } from 'lucide-react';
import './AshaComponents.css';

interface EditBeneficiaryModalProps {
    isOpen: boolean;
    beneficiary: AshaBeneficiary | null;
    onClose: () => void;
    onUpdated?: (updated: AshaBeneficiary) => void;
}

export function EditBeneficiaryModal({
    isOpen,
    beneficiary,
    onClose,
    onUpdated
}: EditBeneficiaryModalProps) {
    const { updateBeneficiary } = useAsha();
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [educationYears, setEducationYears] = useState('6');
    const [language, setLanguage] = useState('hi');
    const [gender, setGender] = useState('female');
    const [villageName, setVillageName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [abhaId, setAbhaId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (beneficiary && isOpen) {
            setFullName(beneficiary.full_name || '');
            setAge(String(beneficiary.age || ''));
            setEducationYears(String(beneficiary.education_years ?? 6));
            setLanguage(beneficiary.preferred_language || 'hi');
            setGender(beneficiary.gender || 'female');
            setVillageName(beneficiary.village_name || '');
            setPhoneNumber(beneficiary.phone_number || '');
            setAbhaId(beneficiary.abha_id || '');
            setError(null);
        }
    }, [beneficiary, isOpen]);

    if (!isOpen || !beneficiary) return null;

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
            const updated = await updateBeneficiary(beneficiary.firebase_uid, {
                full_name: fullName.trim(),
                age: parsedAge,
                education_years: parsedEdu,
                preferred_language: language,
                gender,
                village_name: villageName.trim() || 'Village Unit',
                phone_number: phoneNumber.trim() || undefined,
                abha_id: abhaId.trim() || undefined
            });

            if (updated && onUpdated) {
                onUpdated(updated);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update beneficiary. Please retry.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="asha-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="asha-modal-card" onClick={e => e.stopPropagation()}>
                <div className="asha-modal-header">
                    <div className="asha-header-icon-badge">
                        <UserCheck size={20} />
                    </div>
                    <div>
                        <h2 className="asha-modal-title">Edit Beneficiary Profile</h2>
                        <p className="asha-modal-subtitle">
                            Update contact info, village ward, and chronic health conditions.
                        </p>
                    </div>
                    <button className="asha-modal-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="asha-modal-alert asha-modal-alert-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="asha-modal-form">
                    <div className="asha-form-group">
                        <label className="asha-form-label">Full Name *</label>
                        <input
                            type="text"
                            className="asha-form-input"
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
                                value={villageName}
                                onChange={e => setVillageName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="asha-form-row">
                        <div className="asha-form-group">
                            <label className="asha-form-label">
                                Caregiver Phone Number
                                <span className="asha-form-hint"> (WhatsApp Referral)</span>
                            </label>
                            <input
                                type="tel"
                                className="asha-form-input"
                                placeholder="e.g. 9876543210"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                            />
                        </div>

                        <div className="asha-form-group">
                            <label className="asha-form-label">
                                ABHA ID / Health ID
                            </label>
                            <input
                                type="text"
                                className="asha-form-input"
                                placeholder="e.g. 14-digit ABHA Number"
                                value={abhaId}
                                onChange={e => setAbhaId(e.target.value)}
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
                            {submitting ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
