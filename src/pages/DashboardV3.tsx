/**
 * DashboardV3 — Cognitive Health Dashboard (Redesigned V3.1)
 * ==========================================================
 * Thin orchestration page that calls useDashboardViewModel()
 * and renders all section components in order with live Supabase
 * streaming and multi-trajectory mock dataset switcher.
 */

import { useState } from 'react';
import { PageWrapper } from '../components/layout';
import { useDashboardV3ViewModel } from '../hooks/useDashboardV3ViewModel';
import { useWeeklyReminder } from '../hooks/useWeeklyReminder';
import {
    HeroSummary,
    AIPredictionCard,
    CognitiveRadarSection,
    ModuleTrendCharts,
    ChangesSinceLastVisit,
    AssessmentModuleCards,
    ExplainabilitySection,
    LongitudinalSummary,
    RecommendationCard,
    BiomarkerDrawer,
    SimulationControls,
} from '../components/dashboard-v3';
import './DashboardV3.css';

export function DashboardV3() {
    const vm = useDashboardV3ViewModel();
    useWeeklyReminder();

    // Drawer state for chart drill-down
    const [drawerData, setDrawerData] = useState<{
        isOpen: boolean;
        moduleName: string;
        sessionDate: string;
        rawResult: any;
        moduleKey: string;
    }>({ isOpen: false, moduleName: '', sessionDate: '', rawResult: null, moduleKey: '' });

    // Clinician report modal
    const [, setIsReportOpen] = useState(false);

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
                        <span>Loading live cognitive data from Supabase…</span>
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
                            <h1 className="dv2-serif" style={{ margin: 0 }}>Cognitive Health Dashboard</h1>
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
                                {isLive ? 'Supabase Live' : `Demo: ${vm.dataMode.replace('mock_', '').toUpperCase()}`}
                            </span>
                        </div>
                        <p>Your personalized multi-modal digital biomarker profile</p>
                    </div>
                    <div className="dv2-header-actions">
                        <button onClick={() => setShowSimControls(!showSimControls)}>
                            🧪 {showSimControls ? 'Hide Data Controls' : 'Mock & Data Controls'}
                        </button>
                        <button
                            className="dv2-btn-primary"
                            onClick={() => window.location.href = '/tests'}
                        >
                            🧪 Take Assessment
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
                            isSeeding={vm.isSeeding}
                            refreshLive={vm.refreshLive}
                            hasLiveRecords={vm.sessionCount > 0}
                        />
                    </div>
                )}

                {!vm.hasData ? (
                    /* Empty State */
                    <div className="dv2-card dv2-empty-state dv2-animate-in">
                        <div className="dv2-empty-icon">🧠</div>
                        <h3>Welcome to VyomFlow</h3>
                        <p>Complete your first cognitive assessment to establish your baseline and generate your digital biomarker profile in Supabase.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                            <button className="dv2-btn-primary" onClick={() => window.location.href = '/tests'}>
                                Take Your First Assessment
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
                                🌟 Preview with Demo Dataset
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Section 1: Hero Summary */}
                        <div className="dv2-section">
                            <HeroSummary overview={vm.overview} />
                        </div>

                        {/* Section 2: AI Prediction */}
                        <div className="dv2-section">
                            <AIPredictionCard prediction={vm.aiPrediction} />
                        </div>

                        {/* Section 3: Radar Chart & Multi-Layer Trajectory Scrubber */}
                        <div className="dv2-section">
                            <CognitiveRadarSection
                                scores={vm.radarScores}
                                baselineScores={vm.baselineRadarScores}
                                timeline={vm.radarTimeline}
                            />
                        </div>

                        {/* Section 5: Change Since Last Visit */}
                        <div className="dv2-section">
                            <ChangesSinceLastVisit changes={vm.changes} />
                        </div>

                        {/* Section 4: Module Trend Charts (All 7 Modules) */}
                        <div className="dv2-section">
                            <ModuleTrendCharts
                                trends={vm.moduleTrends}
                                onPointClick={handleChartPointClick}
                            />
                        </div>

                        {/* Section 6: Assessment Modules Grid */}
                        <div className="dv2-section">
                            <AssessmentModuleCards modules={vm.assessmentModules} />
                        </div>

                        {/* Section 7: Explainability (SHAP attributions) */}
                        <div className="dv2-section">
                            <ExplainabilitySection explainability={vm.explainability} />
                        </div>

                        {/* Section 8: Longitudinal Summary */}
                        <div className="dv2-section">
                            <LongitudinalSummary
                                longitudinal={vm.longitudinal}
                            />
                        </div>

                        {/* Section 9: Recommendation Card */}
                        <div className="dv2-section">
                            <RecommendationCard
                                recommendation={vm.recommendation}
                                onOpenReport={() => setIsReportOpen(true)}
                            />
                        </div>
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
            </div>
        </PageWrapper>
    );
}
export default DashboardV3;
