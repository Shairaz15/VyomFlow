import type { AshaBeneficiary } from '../../services/supabaseService';
import { INDIAN_LANGUAGES } from '../common/OnboardingModal';
import './AshaComponents.css';

interface BeneficiaryCardProps {
    beneficiary: AshaBeneficiary;
    onStartTest: (beneficiary: AshaBeneficiary) => void;
    onViewReport: (beneficiary: AshaBeneficiary) => void;
}

export function BeneficiaryCard({ beneficiary, onStartTest, onViewReport }: BeneficiaryCardProps) {
    const langObj = INDIAN_LANGUAGES.find(
        l => l.code === beneficiary.preferred_language || beneficiary.preferred_language?.startsWith(l.code)
    );

    const hasAssessed = (beneficiary.assessments_count ?? 0) > 0;
    const mocaScore = beneficiary.latest_moca != null ? Math.round(beneficiary.latest_moca) : null;
    const tier = beneficiary.latest_alert_tier || 'NOT_ASSESSED';

    const getTierBadge = () => {
        if (!hasAssessed) {
            return {
                label: 'Pending Initial Screening',
                className: 'tier-pending',
                icon: '⏳'
            };
        }
        if (tier === 'STABLE') {
            return {
                label: `Stable Cognitive Profile (${mocaScore}/30)`,
                className: 'tier-stable',
                icon: '✅'
            };
        }
        if (tier.includes('RECOMMEND') || tier.includes('EVALUATION')) {
            return {
                label: `Clinical Review Needed (${mocaScore}/30)`,
                className: 'tier-warning',
                icon: '⚠️'
            };
        }
        return {
            label: `Screened (${mocaScore}/30)`,
            className: 'tier-monitored',
            icon: '📋'
        };
    };

    const badge = getTierBadge();

    const formattedDate = beneficiary.last_assessed_at
        ? new Date(beneficiary.last_assessed_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
          })
        : 'Never assessed';

    return (
        <div className="asha-beneficiary-card">
            <div className="asha-card-top">
                <div className="asha-card-avatar">
                    <span className="asha-avatar-initial">
                        {beneficiary.full_name ? beneficiary.full_name.charAt(0).toUpperCase() : 'P'}
                    </span>
                </div>
                <div className="asha-card-identity">
                    <div className="asha-name-row">
                        <h3 className="asha-beneficiary-name">{beneficiary.full_name}</h3>
                        {beneficiary.is_synced === false && (
                            <span className="asha-unsynced-pill" title="Saved locally, pending cloud sync">
                                ☁️ Offline
                            </span>
                        )}
                    </div>
                    <div className="asha-chips-row">
                        <span className="asha-chip">{beneficiary.age} yrs</span>
                        <span className="asha-chip">{beneficiary.education_years} yrs schooling</span>
                        {beneficiary.gender && <span className="asha-chip capitalize">{beneficiary.gender}</span>}
                    </div>
                </div>
            </div>

            <div className="asha-card-metadata">
                <div className="asha-meta-item">
                    <span className="asha-meta-label">Preferred Language</span>
                    <span className="asha-meta-value language-tag">
                        🗣️ {langObj ? `${langObj.native} (${langObj.label})` : beneficiary.preferred_language}
                    </span>
                </div>

                <div className="asha-meta-item">
                    <span className="asha-meta-label">Village / Locality</span>
                    <span className="asha-meta-value">📍 {beneficiary.village_name || 'Village Unit'}</span>
                </div>
            </div>

            <div className="asha-card-status-bar">
                <div className={`asha-tier-badge ${badge.className}`}>
                    <span className="asha-tier-icon">{badge.icon}</span>
                    <span>{badge.label}</span>
                </div>
                <span className="asha-last-date">Last: {formattedDate}</span>
            </div>

            <div className="asha-card-actions">
                <button
                    className="asha-btn asha-btn-launch"
                    onClick={() => onStartTest(beneficiary)}
                >
                    <span className="asha-btn-icon">▶</span>
                    <span>Start Guided Assessment</span>
                </button>

                {hasAssessed && (
                    <button
                        className="asha-btn asha-btn-outline"
                        onClick={() => onViewReport(beneficiary)}
                    >
                        <span>📊 Report</span>
                    </button>
                )}
            </div>
        </div>
    );
}
