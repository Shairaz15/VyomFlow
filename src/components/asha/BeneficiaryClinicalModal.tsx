import { useEffect, useState } from 'react';
import {
    X,
    Printer,
    Share2,
    Play,
    AlertTriangle,
    Brain,
    Activity,
    Clock,
    Languages,
    Compass,
    Sparkles,
    FileText
} from 'lucide-react';
import type { AshaBeneficiary } from '../../services/supabaseService';
import { getBeneficiaryAssessmentHistory } from '../../services/supabaseService';
import { printPhcReferralSlip } from '../../utils/printReferralSlip';
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

    const handleShareWhatsApp = () => {
        const lines = [
            `🏥 *AYUSHMAN BHARAT / PHC COGNITIVE HEALTH REFERRAL*`,
            `-------------------------------------------`,
            `*Beneficiary:* ${beneficiary.full_name}`,
            `*Age / Gender:* ${beneficiary.age} yrs / ${beneficiary.gender || 'N/A'}`,
            `*Village / Ward:* ${beneficiary.village_name || 'N/A'}`,
            `*ABHA ID:* ${beneficiary.abha_id || 'Not Registered'}`,
            `*Caregiver Phone:* ${beneficiary.phone_number || 'N/A'}`,
            `-------------------------------------------`,
            `*Estimated MoCA Score:* ${mocaScore != null ? Math.round(mocaScore) : 'Pending'}/30`,
            `*Clinical Alert Tier:* ${tier.replace(/_/g, ' ')}`,
            `*Preferred Language:* ${beneficiary.preferred_language ? beneficiary.preferred_language.toUpperCase() : 'EN'}`,
            `-------------------------------------------`,
            `*Referral Note:* Frontline digital biomarker screening indicates deviation from normative baselines. Patient is referred to the Primary Health Centre (PHC) Medical Officer for comprehensive diagnostic evaluation.`,
            `*Platform:* VyomFlow CogniTrack ASHA Frontline Suite`
        ];
        const text = encodeURIComponent(lines.join('\n'));
        const cleanPhone = beneficiary.phone_number ? beneficiary.phone_number.replace(/\D/g, '') : '';
        const url = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
    };

    const handlePrintReferral = () => {
        printPhcReferralSlip({
            beneficiary,
            latestSession: latest
        });
    };

    // Calculate domain color based on percentage
    const getDomainColor = (score: number | null | undefined) => {
        if (score == null) return '#94a3b8';
        if (score >= 75) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const domainList = latest ? [
        { name: 'Memory Recall', score: latest.domain_memory, icon: Brain },
        { name: 'Executive Control', score: latest.domain_executive, icon: Sparkles },
        { name: 'Processing Speed', score: latest.domain_processing_speed, icon: Clock },
        { name: 'Attention & Focus', score: latest.domain_attention, icon: Activity },
        { name: 'Spatial Navigation', score: latest.domain_spatial_orientation, icon: Compass },
        { name: 'Language', score: latest.domain_language, icon: Languages }
    ] : [];

    return (
        <div className="asha-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="min-clinical-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="min-clinical-header no-print">
                    <div className="min-clinical-header-left">
                        <div className="min-clinical-avatar">
                            {beneficiary.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="min-clinical-title-row">
                                <h2 className="min-clinical-name">{beneficiary.full_name}</h2>
                                <span className="min-clinical-badge">Clinical Report</span>
                            </div>
                            <p className="min-clinical-meta">
                                {beneficiary.age} yrs • {beneficiary.village_name || 'Village N/A'}
                                {beneficiary.education_years != null && ` • ${beneficiary.education_years}y education`}
                                {beneficiary.abha_id && ` • ABHA: ${beneficiary.abha_id}`}
                                {beneficiary.phone_number && ` • 📞 ${beneficiary.phone_number}`}
                            </p>
                        </div>
                    </div>
                    <button className="min-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={18} />
                    </button>
                </div>

                {/* Visible Body */}
                <div className="min-clinical-body no-print">
                    {/* High Risk Alert Banner */}
                    {tier === 'CLINICAL_REVIEW' && (
                        <div className="min-clinical-alert">
                            <AlertTriangle size={18} className="min-clinical-alert-icon" />
                            <div className="min-clinical-alert-content">
                                <strong>Clinical Review Recommended</strong>
                                <span>Variance detected in memory or processing speed. Expedited PHC consultation advised.</span>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="min-clinical-loading">
                            <div className="min-loading-spinner" />
                            <span>Loading clinical records...</span>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="min-clinical-empty">
                            <div className="min-empty-icon-wrap">
                                <FileText size={32} />
                            </div>
                            <h3>No Completed Assessments Yet</h3>
                            <p>Conduct a 3-minute frontline digital screening to generate an estimated MoCA score and domain profile.</p>
                            <button
                                className="min-btn min-btn-primary"
                                onClick={() => {
                                    onClose();
                                    onStartTest(beneficiary);
                                }}
                            >
                                <Play size={14} /> Start Rapid Screening
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Summary Card */}
                            <div className="min-summary-card">
                                <div className="min-score-column">
                                    <span className="min-summary-label">Estimated MoCA</span>
                                    <div className="min-score-value">
                                        {mocaScore != null ? Math.round(mocaScore) : '--'}
                                        <span className="min-score-total"> / 30</span>
                                    </div>
                                    <span className="min-score-sub">
                                        Norm: 26+ {beneficiary.education_years <= 12 ? '(+1 Edu Norm)' : ''}
                                    </span>
                                </div>

                                <div className="min-tier-column">
                                    <span className="min-summary-label">Triage Classification</span>
                                    <div className={`min-tier-pill min-tier-${tier.toLowerCase()}`}>
                                        <span className="min-tier-dot" />
                                        {tier === 'STABLE' ? 'Stable Baseline' : tier === 'CLINICAL_REVIEW' ? 'Review Needed' : tier.replace(/_/g, ' ')}
                                    </div>
                                    <p className="min-tier-desc">
                                        {tier === 'STABLE'
                                            ? 'Cognitive metrics align with normative baselines for age and schooling.'
                                            : tier === 'CLINICAL_REVIEW'
                                            ? 'Notable variance across recall or response latencies. Expedited PHC referral advised.'
                                            : 'Slight deviation observed across speed or recall metrics. Continue routine monitoring.'}
                                    </p>
                                </div>
                            </div>

                            {/* Language & Schooling Tags */}
                            <div className="min-tags-row">
                                <span className="min-condition-tag neutral">
                                    <Languages size={12} />
                                    Language: {beneficiary.preferred_language ? beneficiary.preferred_language.toUpperCase() : 'EN'}
                                </span>
                                {beneficiary.education_years != null && (
                                    <span className="min-condition-tag neutral">
                                        Schooling: {beneficiary.education_years} yrs
                                    </span>
                                )}
                            </div>

                            {/* Cognitive Domain Performance */}
                            {latest && (
                                <div className="min-section">
                                    <h4 className="min-section-title">Cognitive Domain Performance</h4>
                                    <div className="min-domains-grid">
                                        {domainList.map(domain => {
                                            const Icon = domain.icon;
                                            const color = getDomainColor(domain.score);
                                            const pct = domain.score != null ? Math.round(domain.score) : null;
                                            return (
                                                <div key={domain.name} className="min-domain-card">
                                                    <div className="min-domain-top">
                                                        <span className="min-domain-name">
                                                            <Icon size={14} className="min-domain-icon" />
                                                            {domain.name}
                                                        </span>
                                                        <span className="min-domain-val" style={{ color }}>
                                                            {pct != null ? `${pct}%` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="min-bar-track">
                                                        <div
                                                            className="min-bar-fill"
                                                            style={{
                                                                width: `${Math.min(100, Math.max(0, pct || 0))}%`,
                                                                backgroundColor: color
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Assessment History */}
                            <div className="min-section">
                                <div className="min-section-header">
                                    <h4 className="min-section-title">Assessment History ({sessions.length})</h4>
                                </div>
                                <div className="min-history-list">
                                    {sessions.map((s, idx) => (
                                        <div key={s.id || idx} className="min-history-row">
                                            <div className="min-history-info">
                                                <span className="min-history-date">
                                                    {new Date(s.session_date).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className={`min-history-tier min-tier-${(s.clinical_alert_tier || 'stable').toLowerCase()}`}>
                                                    {(s.clinical_alert_tier || 'STABLE').replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <span className="min-history-score">
                                                MoCA {s.estimated_moca ? Math.round(s.estimated_moca) : '--'}/30
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Clean Footer Actions */}
                <div className="min-clinical-footer no-print">
                    <div className="min-footer-left">
                        <button
                            type="button"
                            className="min-btn min-btn-secondary min-whatsapp-btn"
                            onClick={handleShareWhatsApp}
                            title="Send formatted referral summary to Caregiver or Medical Officer via WhatsApp"
                        >
                            <Share2 size={14} /> WhatsApp Referral
                        </button>
                        <button
                            type="button"
                            className="min-btn min-btn-secondary"
                            onClick={handlePrintReferral}
                            title="Print physical triage card for Primary Health Centre"
                        >
                            <Printer size={14} /> Print PHC Slip
                        </button>
                    </div>
                    <div className="min-footer-right">
                        <button type="button" className="min-btn min-btn-ghost" onClick={onClose}>
                            Close
                        </button>
                        <button
                            type="button"
                            className="min-btn min-btn-primary"
                            onClick={() => {
                                onClose();
                                onStartTest(beneficiary);
                            }}
                        >
                            <Play size={14} /> New Screening
                        </button>
                    </div>
                </div>

                {/* Printable Slip Container (Active during window.print()) */}
                <div className="phc-printable-slip">
                    <div className="phc-slip-header">
                        <div className="phc-emblem-text">AYUSHMAN BHARAT • HEALTH & WELLNESS CENTRE</div>
                        <h2>PRIMARY HEALTH CENTRE COGNITIVE TRIAGE REFERRAL</h2>
                        <div className="phc-slip-meta">
                            <span>Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                            <span>Frontline Screening Unit: ASHA Frontline CogniTrack</span>
                        </div>
                    </div>

                    <div className="phc-divider" />

                    <div className="phc-section">
                        <h3>1. BENEFICIARY DEMOGRAPHICS</h3>
                        <table className="phc-table">
                            <tbody>
                                <tr>
                                    <td><strong>Full Name:</strong> {beneficiary.full_name}</td>
                                    <td><strong>Age / Gender:</strong> {beneficiary.age} yrs / {beneficiary.gender || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Village / Ward:</strong> {beneficiary.village_name || 'N/A'}</td>
                                    <td><strong>Years of Schooling:</strong> {beneficiary.education_years} yrs</td>
                                </tr>
                                <tr>
                                    <td><strong>ABHA ID:</strong> {beneficiary.abha_id || 'Not Registered'}</td>
                                    <td><strong>Caregiver Contact:</strong> {beneficiary.phone_number || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="phc-section">
                        <h3>2. DIGITAL SCREENING RESULTS</h3>
                        <div className="phc-results-row">
                            <div className="phc-result-box">
                                <span className="phc-result-label">ESTIMATED MoCA</span>
                                <span className="phc-result-val">{mocaScore != null ? Math.round(mocaScore) : '--'}/30</span>
                            </div>
                            <div className="phc-result-box">
                                <span className="phc-result-label">TRIAGE STATUS</span>
                                <span className="phc-result-val">{tier.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="phc-result-box">
                                <span className="phc-result-label">TESTS ADMINISTERED</span>
                                <span className="phc-result-val">{sessions.length} Session(s)</span>
                            </div>
                        </div>

                        {latest && (
                            <table className="phc-domains-table">
                                <thead>
                                    <tr>
                                        <th>Domain</th>
                                        <th>Score</th>
                                        <th>Domain</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Memory Recall</td>
                                        <td>{latest.domain_memory != null ? `${Math.round(latest.domain_memory)}%` : 'N/A'}</td>
                                        <td>Executive Control</td>
                                        <td>{latest.domain_executive != null ? `${Math.round(latest.domain_executive)}%` : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td>Processing Speed</td>
                                        <td>{latest.domain_processing_speed != null ? `${Math.round(latest.domain_processing_speed)}%` : 'N/A'}</td>
                                        <td>Attention & Focus</td>
                                        <td>{latest.domain_attention != null ? `${Math.round(latest.domain_attention)}%` : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td>Spatial Navigation</td>
                                        <td>{latest.domain_spatial_orientation != null ? `${Math.round(latest.domain_spatial_orientation)}%` : 'N/A'}</td>
                                        <td>Language</td>
                                        <td>{latest.domain_language != null ? `${Math.round(latest.domain_language)}%` : 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="phc-section phc-mo-section">
                        <h3>3. MEDICAL OFFICER (PHC) CLINICAL NOTES & PRESCRIPTION</h3>
                        <div className="phc-doctor-notes-area">
                            <div className="phc-mo-checkboxes">
                                <span>[ ] Normal Aging / No Clinical Deficit</span>
                                <span>[ ] Mild Cognitive Impairment (MCI)</span>
                                <span>[ ] Suspected Dementia</span>
                                <span>[ ] Secondary / Metabolic Cause</span>
                            </div>
                            <div className="phc-blank-lines">
                                <div className="phc-line" />
                                <div className="phc-line" />
                                <div className="phc-line" />
                            </div>
                        </div>
                    </div>

                    <div className="phc-signatures">
                        <div className="phc-sig-block">
                            <div className="phc-sig-line" />
                            <span>ASHA Worker Signature & Date</span>
                        </div>
                        <div className="phc-sig-block">
                            <div className="phc-sig-line" />
                            <span>Medical Officer Signature & Registration Stamp</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
