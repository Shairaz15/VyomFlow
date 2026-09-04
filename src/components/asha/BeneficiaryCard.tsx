import { useState } from 'react';
import type { AshaBeneficiary } from '../../services/supabaseService';
import {
    Play,
    FileText,
    Edit3,
    Trash2,
    Phone,
    MoreVertical,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Sparkles
} from 'lucide-react';
import './AshaComponents.css';

interface BeneficiaryCardProps {
    beneficiary: AshaBeneficiary;
    onStartTest: (beneficiary: AshaBeneficiary) => void;
    onViewReport: (beneficiary: AshaBeneficiary) => void;
    onEdit?: (beneficiary: AshaBeneficiary) => void;
    onDelete?: (beneficiary: AshaBeneficiary) => void;
}

export function BeneficiaryCard({
    beneficiary,
    onStartTest,
    onViewReport,
    onEdit,
    onDelete
}: BeneficiaryCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const hasAssessed = (beneficiary.assessments_count ?? 0) > 0;
    const mocaScore = beneficiary.latest_moca != null ? Math.round(beneficiary.latest_moca) : null;
    const tier = beneficiary.latest_alert_tier || 'NOT_ASSESSED';

    const isHighRisk = tier.includes('RECOMMEND') || tier.includes('EVALUATION') || tier === 'CLINICAL_REVIEW';

    const getTierMeta = () => {
        if (!hasAssessed) {
            return {
                label: 'Pending Screening',
                badgeClass: 'min-tier-pending',
                barColor: '#f59e0b',
                icon: <Clock size={13} />
            };
        }
        if (tier === 'STABLE') {
            return {
                label: 'Stable Baselines',
                badgeClass: 'min-tier-stable',
                barColor: '#10b981',
                icon: <CheckCircle2 size={13} />
            };
        }
        if (isHighRisk) {
            return {
                label: 'Clinical Review Needed',
                badgeClass: 'min-tier-warning',
                barColor: '#f43f5e',
                icon: <AlertTriangle size={13} />
            };
        }
        return {
            label: 'Monitored',
            badgeClass: 'min-tier-monitored',
            barColor: '#6366f1',
            icon: <Sparkles size={13} />
        };
    };

    const tierMeta = getTierMeta();
    const scorePercent = mocaScore != null ? Math.min(100, Math.max(10, Math.round((mocaScore / 30) * 100))) : 0;

    const handleDeleteClick = () => {
        setShowMenu(false);
        if (window.confirm(`Remove ${beneficiary.full_name} from the field roster?`)) {
            onDelete?.(beneficiary);
        }
    };

    return (
        <div className={`min-beneficiary-card ${isHighRisk ? 'is-high-risk' : ''}`}>
            {/* Header: Avatar, Name & Options Menu */}
            <div className="min-card-header">
                <div className="min-avatar">
                    {beneficiary.full_name ? beneficiary.full_name.charAt(0).toUpperCase() : 'P'}
                </div>

                <div className="min-identity">
                    <div className="min-name-row">
                        <h3 className="min-name">{beneficiary.full_name}</h3>
                        {beneficiary.is_synced === false && (
                            <span className="min-offline-dot" title="Offline record, will sync automatically" />
                        )}
                    </div>
                    <div className="min-subtitle">
                        <span>{beneficiary.age} yrs</span>
                        <span className="min-sep">•</span>
                        <span>{beneficiary.village_name || 'Village'}</span>
                        {beneficiary.phone_number && (
                            <>
                                <span className="min-sep">•</span>
                                <span className="min-phone">
                                    <Phone size={10} /> {beneficiary.phone_number}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Quiet Options Menu Button */}
                <div className="min-menu-container">
                    <button
                        type="button"
                        className="min-menu-trigger"
                        onClick={() => setShowMenu(prev => !prev)}
                        title="More options"
                    >
                        <MoreVertical size={15} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="min-menu-backdrop" onClick={() => setShowMenu(false)} />
                            <div className="min-menu-dropdown">
                                {onEdit && (
                                    <button
                                        type="button"
                                        className="min-menu-item"
                                        onClick={() => {
                                            setShowMenu(false);
                                            onEdit(beneficiary);
                                        }}
                                    >
                                        <Edit3 size={13} /> Edit Profile
                                    </button>
                                )}
                                {hasAssessed && (
                                    <button
                                        type="button"
                                        className="min-menu-item"
                                        onClick={() => {
                                            setShowMenu(false);
                                            onStartTest(beneficiary);
                                        }}
                                    >
                                        <Play size={13} /> Re-screen
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        type="button"
                                        className="min-menu-item danger"
                                        onClick={handleDeleteClick}
                                    >
                                        <Trash2 size={13} /> Remove
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Status & MoCA Score Pill */}
            <div className="min-card-body">
                <div className="min-status-row">
                    <div className={`min-status-badge ${tierMeta.badgeClass}`}>
                        {tierMeta.icon}
                        <span>{tierMeta.label}</span>
                    </div>

                    {hasAssessed && (
                        <div className="min-moca-score">
                            <strong>{mocaScore}</strong>
                            <span>/30</span>
                        </div>
                    )}
                </div>

                {hasAssessed && (
                    <div className="min-score-track">
                        <div
                            className="min-score-fill"
                            style={{
                                width: `${scorePercent}%`,
                                backgroundColor: tierMeta.barColor
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Single Prominent Primary Action */}
            <div className="min-card-footer">
                {hasAssessed ? (
                    <button
                        type="button"
                        className="min-btn min-btn-secondary"
                        onClick={() => onViewReport(beneficiary)}
                    >
                        <FileText size={14} />
                        <span>Clinical Report & Referral</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        className="min-btn min-btn-primary"
                        onClick={() => onStartTest(beneficiary)}
                    >
                        <Play size={14} fill="currentColor" />
                        <span>Start Screening</span>
                    </button>
                )}
            </div>
        </div>
    );
}
