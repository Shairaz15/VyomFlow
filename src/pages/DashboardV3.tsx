/**
 * DashboardV3 — Cognitive Health Dashboard (Redesigned V3.1)
 * ==========================================================
 * Thin orchestration page that calls useDashboardViewModel()
 * and renders all section components in order with live Supabase
 * streaming and multi-trajectory mock dataset switcher.
 */

import { useState } from 'react';
import { PageWrapper } from '../components/layout';
import { VyomFlowLogo } from '../components/common';
import { useDashboardV3ViewModel } from '../hooks/useDashboardV3ViewModel';
import { useWeeklyReminder } from '../hooks/useWeeklyReminder';
import { useLanguage } from '../i18n/LanguageContext';
import {
    HeroSummary,
    AIPredictionCard,
    DomainScoreCards,
    CognitiveRadarSection,
    ModuleTrendCharts,
    AssessmentModuleCards,
    BiomarkerDrawer,
    SimulationControls,
    ClinicianReportModal,
} from '../components/dashboard-v3';
import { LayoutDashboard, TrendingUp, FileText, SlidersHorizontal } from 'lucide-react';
import './DashboardV3.css';

export function DashboardV3() {
    const vm = useDashboardV3ViewModel();
    const { t } = useLanguage();
    useWeeklyReminder();

    // Active executive tab view ('summary' | 'trends')
    const [activeView, setActiveView] = useState<'summary' | 'trends'>('summary');

    // Drawer state for chart drill-down
    const [drawerData, setDrawerData] = useState<{
        isOpen: boolean;
        moduleName: string;
        sessionDate: string;
        rawResult: any;
        moduleKey: string;
    }>({ isOpen: false, moduleName: '', sessionDate: '', rawResult: null, moduleKey: '' });

    // Clinician report modal
    const [isReportOpen, setIsReportOpen] = useState(false);

    // Simulation controls (dev/demo toggle)
    const [showSimControls, setShowSimControls] = useState(false);

    // Handle chart data point click
    const handleChartPointClick = (moduleKey: string, moduleName: string, session: any) => {
        setDrawerData({
            isOpen: true,
            moduleName,
            sessionDate: session.date,
            rawResult: session.rawResult,
            moduleKey,
        });
    };

    if (vm.isLoading) {
        return (
            <PageWrapper>
                <div className="dv2-container">
                    <div className="dv2-loading">
                        <div className="dv2-loading-spinner" />
                        <span>{t("dashboard.loadingData")}</span>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    const isLive = vm.dataMode === 'live';

    return (
        <PageWrapper>
            <div className="dv2-container">
                {/* Header */}
                <header className="dv2-header">
                    <div className="dv2-header-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                            <h1 className="dv2-serif" style={{ margin: 0 }}>{t("dashboard.title")}</h1>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                color: isLive ? '#34d399' : '#38bdf8',
                                border: isLive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? '#10b981' : '#38bdf8' }} />
                                {isLive ? t("dashboard.supabaseLive") : `Demo: ${vm.dataMode.replace('mock_', '').toUpperCase()}`}
                            </span>
                        </div>
                        <p>{t("dashboard.subtitle")}</p>
                    </div>
                    <div className="dv2-header-actions">
                        <button
                            className="dv2-btn-report"
                            onClick={() => setIsReportOpen(true)}
                        >
                            <FileText size={15} />
                            <span>{t("dashboard.exportReport")}</span>
                        </button>
                        <button onClick={() => setShowSimControls(!showSimControls)}>
                            <SlidersHorizontal size={14} />
                            <span>{showSimControls ? t("dashboard.hideControls") : t("dashboard.dataControls")}</span>
                        </button>
                        <button
                            className="dv2-btn-primary"
                            onClick={() => window.location.href = '/tests'}
                        >
                            {t("dashboard.takeAssessment")}
                        </button>
                    </div>
                </header>

                {/* Simulation & Data Source Controls */}
                {showSimControls && (
                    <div className="dv2-section">
                        <SimulationControls
                            dataMode={vm.dataMode}
                            setDataMode={vm.setDataMode}
                            seedMockPreset={vm.seedMockPreset}
                            clearMockData={vm.clearMockData}
                            deleteAllData={vm.deleteAllData}
                            isSeeding={vm.isSeeding}
                            refreshLive={vm.refreshLive}
                            hasLiveRecords={vm.sessionCount > 0}
                        />
                    </div>
                )}

                {!vm.hasData ? (
                    /* Empty State */
                    <div className="dv2-card dv2-empty-state dv2-animate-in">
                        <div className="dv2-empty-icon">
                            <VyomFlowLogo variant="icon" height={56} className="dv2-welcome-brand-logo" />
                        </div>
                        <h3>{t("dashboard.welcomeTitle")}</h3>
                        <p>{t("dashboard.welcomeSubtitle")}</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                            <button className="dv2-btn-primary" onClick={() => window.location.href = '/tests'}>
                                {t("dashboard.takeFirstAssessment")}
                            </button>
                            <button
                                onClick={() => vm.seedMockPreset('stable')}
                                style={{
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    color: '#38bdf8',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                    borderRadius: '8px',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {t("dashboard.previewDemo")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Executive Segmented View Switcher */}
                        <div className="dv2-view-switcher-bar">
                            <div className="dv2-view-switcher">
                                <button
                                    type="button"
                                    className={`dv2-view-tab ${activeView === 'summary' ? 'active' : ''}`}
                                    onClick={() => setActiveView('summary')}
                                >
                                    <LayoutDashboard size={15} />
                                    <span>Executive Summary</span>
                                </button>
                                <button
                                    type="button"
                                    className={`dv2-view-tab ${activeView === 'trends' ? 'active' : ''}`}
                                    onClick={() => setActiveView('trends')}
                                >
                                    <TrendingUp size={15} />
                                    <span>Longitudinal Trends</span>
                                </button>
                            </div>

                            <div className="dv2-view-meta-tag">
                                <span>Active Session {vm.sessionCount}</span>
                                <span>•</span>
                                <span>Multi-Task Deep Learning Active</span>
                            </div>
                        </div>

                        {/* View Content based on activeView */}
                        {activeView === 'summary' && (
                            <div className="dv2-view-content">
                                {/* Bento Grid: Status + Radar + Trends on Left; AI MoCA + Domains + Tests on Right */}
                                <div className="dv2-bento-grid">
                                    {/* Left Bento Column: Overall Status + 6-Domain Cognitive Envelope + Longitudinal Trends */}
                                    <div className="dv2-bento-col">
                                        <HeroSummary overview={vm.overview} sessionCount={vm.sessionCount} />
                                        <CognitiveRadarSection
                                            scores={vm.radarScores}
                                            baselineScores={vm.baselineRadarScores}
                                            timeline={vm.radarTimeline}
                                        />
                                        <ModuleTrendCharts
                                            trends={vm.moduleTrends}
                                            onPointClick={handleChartPointClick}
                                        />
                                    </div>

                                    {/* Right Bento Column: AI MoCA Assessment + 6 Cognitive Domains + 7 Modules Battery */}
                                    <div className="dv2-bento-col">
                                        <AIPredictionCard prediction={vm.aiPrediction} />
                                        <DomainScoreCards domains={vm.domainScores} />
                                        <AssessmentModuleCards modules={vm.assessmentModules} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'trends' && (
                            <div className="dv2-view-content">
                                <div className="dv2-section">
                                    <ModuleTrendCharts
                                        trends={vm.moduleTrends}
                                        onPointClick={handleChartPointClick}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Drill-down Drawer */}
                <BiomarkerDrawer
                    isOpen={drawerData.isOpen}
                    onClose={() => setDrawerData(prev => ({ ...prev, isOpen: false }))}
                    moduleName={drawerData.moduleName}
                    moduleKey={drawerData.moduleKey}
                    sessionDate={drawerData.sessionDate}
                    rawResult={drawerData.rawResult}
                />

                {/* Clinician Diagnostic Report & Print Modal */}
                <ClinicianReportModal
                    isOpen={isReportOpen}
                    onClose={() => setIsReportOpen(false)}
                    vm={vm}
                />
            </div>
        </PageWrapper>
    );
}
export default DashboardV3;
