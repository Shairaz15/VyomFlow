import { useState } from 'react';
import type { LongitudinalViewModel } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
    longitudinal: LongitudinalViewModel;
}

export function LongitudinalSummary({ longitudinal }: Props) {
    const { t } = useLanguage();
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div className="dv2-card dv2-animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="dv2-section-title" style={{ margin: 0 }}>{t("dashboard.trendAnalysis")}</h3>
                <span
                    className="dv2-status-badge"
                    style={{
                        background: `${longitudinal.trajectoryColor}22`,
                        color: longitudinal.trajectoryColor,
                    }}
                >
                    {longitudinal.trajectory}
                </span>
            </div>

            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>
                {longitudinal.summary}
            </p>

            <div style={{ fontSize: '0.8125rem', color: 'var(--dv2-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span>{t("dashboard.comparedSessions", { count: longitudinal.sessionCount })}</span>
                <span>{t("dashboard.lastUpdated", { date: longitudinal.lastUpdated })}</span>
            </div>

            {longitudinal.advancedMetrics && (
                <div style={{ marginTop: '0.75rem' }}>
                    <button
                        className="dv2-advanced-toggle"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? t("dashboard.hideClinicalMetrics") : t("dashboard.showClinicalMetrics")}
                    </button>

                    {showAdvanced && (
                        <div className="dv2-advanced-grid">
                            <div className="dv2-metric-cell">
                                <div className="dv2-metric-label">RCI</div>
                                <div className="dv2-metric-value">{longitudinal.advancedMetrics.rci}</div>
                            </div>
                            <div className="dv2-metric-cell">
                                <div className="dv2-metric-label">β (slope/mo)</div>
                                <div className="dv2-metric-value">{longitudinal.advancedMetrics.theilSenSlope}</div>
                            </div>
                            <div className="dv2-metric-cell">
                                <div className="dv2-metric-label">Z-Drift</div>
                                <div className="dv2-metric-value">{longitudinal.advancedMetrics.zDrift}</div>
                            </div>
                            <div className="dv2-metric-cell">
                                <div className="dv2-metric-label">CV (%)</div>
                                <div className="dv2-metric-value">{longitudinal.advancedMetrics.cv}%</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
