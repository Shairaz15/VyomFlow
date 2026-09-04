import { useEffect, useState } from 'react';
import type { AshaBeneficiary } from '../../services/supabaseService';
import { getBeneficiaryAssessmentHistory } from '../../services/supabaseService';
import './AshaComponents.css';

interface BeneficiaryClinicalModalProps {
    isOpen: boolean;
    beneficiary: AshaBeneficiary | null;
    onClose: () => void;
    onStartTest: (beneficiary: AshaBeneficiary) => void;
}

export function BeneficiaryClinicalModal({
    isOpen,
    beneficiary,
    onClose,
    onStartTest
}: BeneficiaryClinicalModalProps) {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && beneficiary) {
            setLoading(true);
            getBeneficiaryAssessmentHistory(beneficiary.firebase_uid)
                .then(data => setSessions(data))
                .finally(() => setLoading(false));
        } else {
            setSessions([]);
        }
    }, [isOpen, beneficiary]);

    if (!isOpen || !beneficiary) return null;

    const latest = sessions[0];
    const mocaScore = latest?.estimated_moca ?? beneficiary.latest_moca ?? null;
    const tier = latest?.clinical_alert_tier ?? beneficiary.latest_alert_tier ?? 'PENDING';

    return (
        <div className="asha-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="asha-modal-card asha-report-modal" onClick={e => e.stopPropagation()}>
                <div className="asha-modal-header">
                    <div>
                        <div className="asha-report-badge">CLINICAL BIOMARKER REPORT</div>
                        <h2 className="asha-modal-title">{beneficiary.full_name}</h2>
                        <p className="asha-modal-subtitle">
                            Age: {beneficiary.age} • Education: {beneficiary.education_years} yrs • Language: {beneficiary.preferred_language}
                        </p>
                    </div>
                    <button className="asha-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="asha-report-body">
                    {loading ? (
                        <div className="asha-loading-state">Loading clinical session records...</div>
                    ) : sessions.length === 0 ? (
                        <div className="asha-empty-report">
                            <span className="asha-empty-icon">📝</span>
                            <h3>No Completed Assessments Yet</h3>
                            <p>Conduct a digital biomarker assessment to generate their clinical cognitive profile.</p>
                            <button
                                className="asha-btn asha-btn-primary"
                                onClick={() => {
                                    onClose();
                                    onStartTest(beneficiary);
                                }}
                            >
                                Start First Assessment Now
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Summary Hero */}
                            <div className="asha-score-hero">
                                <div className="asha-moca-tile">
                                    <span className="asha-moca-sub">Estimated MoCA</span>
                                    <div className="asha-moca-value">
                                        {mocaScore != null ? Math.round(mocaScore) : '--'}
                                        <span className="asha-moca-max">/30</span>
                                    </div>
                                    <span className="asha-moca-norm">
                                        {beneficiary.education_years <= 12 ? '+1 Education Norm Applied' : 'Standard Norm'}
                                    </span>
                                </div>

                                <div className="asha-tier-tile">
                                    <span className="asha-moca-sub">Screening Tier</span>
                                    <div className="asha-tier-title">{tier.replace(/_/g, ' ')}</div>
                                    <p className="asha-tier-desc">
                                        {tier === 'STABLE'
                                            ? 'Cognitive performance matches expected baselines for age & schooling.'
                                            : 'Slight deviation observed across speed or recall metrics. Continue routine monitoring.'}
                                    </p>
                                </div>
                            </div>

                            {/* Cognitive Domain Breakdown */}
                            {latest && (
                                <div className="asha-domain-section">
                                    <h4 className="asha-section-heading">Cognitive Domain Performance</h4>
                                    <div className="asha-domains-grid">
                                        {[
                                            { name: 'Memory', score: latest.domain_memory },
                                            { name: 'Executive Control', score: latest.domain_executive },
                                            { name: 'Processing Speed', score: latest.domain_processing_speed },
                                            { name: 'Attention', score: latest.domain_attention },
                                            { name: 'Spatial Navigation', score: latest.domain_spatial_orientation },
                                            { name: 'Language', score: latest.domain_language }
                                        ].map(domain => (
                                            <div key={domain.name} className="asha-domain-card">
                                                <div className="asha-domain-header">
                                                    <span>{domain.name}</span>
                                                    <span className="asha-domain-score">
                                                        {domain.score != null ? `${Math.round(domain.score)}%` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="asha-progress-track">
                                                    <div
                                                        className="asha-progress-fill"
                                                        style={{ width: `${Math.min(100, Math.max(0, domain.score || 0))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Session Timeline */}
                            <div className="asha-history-section">
                                <h4 className="asha-section-heading">Assessment History ({sessions.length})</h4>
                                <div className="asha-history-list">
                                    {sessions.map((s, idx) => (
                                        <div key={s.id || idx} className="asha-history-item">
                                            <div>
                                                <span className="asha-history-date">
                                                    {new Date(s.session_date).toLocaleString(undefined, {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </span>
                                                <span className="asha-history-tier">Tier: {s.clinical_alert_tier}</span>
                                            </div>
                                            <span className="asha-history-score">
                                                MoCA: {s.estimated_moca ? Math.round(s.estimated_moca) : '--'}/30
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="asha-modal-actions">
                    <button type="button" className="asha-btn asha-btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    <button
                        type="button"
                        className="asha-btn asha-btn-primary"
                        onClick={() => {
                            onClose();
                            onStartTest(beneficiary);
                        }}
                    >
                        Conduct New Test for {beneficiary.full_name.split(' ')[0]}
                    </button>
                </div>
            </div>
        </div>
    );
}
