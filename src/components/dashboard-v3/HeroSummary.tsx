import type { OverviewViewModel } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShieldCheck, AlertCircle, AlertTriangle, Award, CheckCircle2, Calendar, Zap } from 'lucide-react';

interface Props {
    overview: OverviewViewModel;
    sessionCount?: number;
}

export function HeroSummary({ overview, sessionCount }: Props) {
    const { t } = useLanguage();

    if (!overview) return null;

    // 1 Session = Completing all 7 digital assessments once
    const sessionsDone = overview.fullSessionsCompleted ?? sessionCount ?? 1;
    const statusColor = overview.statusColor || 'green';

    // Status icon mapping
    const renderStatusIcon = () => {
        if (statusColor === 'green') {
            return <ShieldCheck size={28} className="dv2-hero-status-svg green" />;
        }
        if (statusColor === 'yellow' || statusColor === 'orange') {
            return <AlertCircle size={28} className="dv2-hero-status-svg orange" />;
        }
        return <AlertTriangle size={28} className="dv2-hero-status-svg red" />;
    };

    return (
        <div className="dv2-card dv2-animate-in dv2-hero-card">
            {/* Top Row: Left has Status & Date; Right has Sessions Done Mark */}
            <div className="dv2-hero-top-row">
                <div className="dv2-hero-status-left">
                    <div className={`dv2-hero-icon-wrapper ${statusColor}`}>
                        {renderStatusIcon()}
                    </div>
                    <div>
                        <div className="dv2-hero-title-wrap">
                            <h2 className="dv2-serif dv2-hero-title">
                                {t("dashboard.overallStatus")}
                            </h2>
                            <span className={`dv2-status-badge ${statusColor}`}>
                                {overview.cognitiveStatus}
                            </span>
                        </div>
                        <div className="dv2-hero-meta-row">
                            <span className="dv2-confidence-ring">
                                <Zap size={13} style={{ color: 'var(--dv2-gold, #f59e0b)' }} />
                                {t("dashboard.confidence", { val: overview.confidence })}
                            </span>
                            <span className="dv2-hero-date">
                                <Calendar size={13} />
                                {t("dashboard.lastAssessment", { date: overview.lastAssessmentDate })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top Right: Number of Full Sessions Done Mark */}
                <div className="dv2-sessions-mark-card" title="1 Session = All 7 assessments completed once">
                    <div className="dv2-sessions-mark-badge">
                        <Award size={18} className="dv2-sessions-mark-icon" />
                        <span className="dv2-sessions-mark-num">{sessionsDone}</span>
                        <span className="dv2-sessions-mark-text">{sessionsDone === 1 ? 'Session' : 'Sessions'} Done</span>
                    </div>
                    <div className="dv2-sessions-mark-sub">
                        <CheckCircle2 size={12} className="dv2-sessions-check-icon" />
                        <span>All 7 assessments completed</span>
                    </div>
                </div>
            </div>

            {/* Simplified, High-Clarity Body */}
            <div className="dv2-hero-body">
                <div className="dv2-hero-info-box">
                    <div className="dv2-hero-info-line">
                        <span className="dv2-hero-info-label">{t("patientResults.comparedToLastTime")}:</span>
                        <span className="dv2-hero-info-val">{overview.comparisonSummary}</span>
                    </div>
                    <div className="dv2-hero-tip-line">
                        <span className="dv2-hero-tip-tag">Next Step</span>
                        <span className="dv2-hero-tip-text">{overview.recommendation}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
