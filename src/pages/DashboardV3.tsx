/**
 * DashboardV3 — Cognitive Health Dashboard (Redesigned)
 * =====================================================
 * Thin orchestration page that calls useDashboardViewModel()
 * and renders all 10 section components in order.
 */

import { useState } from 'react';
import { PageWrapper } from '../components/layout';
import { useDashboardV3ViewModel } from '../hooks/useDashboardV3ViewModel';
import { useWeeklyReminder } from '../hooks/useWeeklyReminder';
import {
    HeroSummary,
    AIPredictionCard,
    DomainScoreCards,
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
    // const { t } = useLanguage();
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

    // Simulation controls (dev toggle)
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
                        <span>Loading your cognitive profile…</span>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="dv2-container">
                {/* Header */}
                <header className="dv2-header">
                    <div className="dv2-header-left">
                        <h1 className="dv2-serif">Cognitive Health Dashboard</h1>
                        <p>Your personalized cognitive health overview</p>
                    </div>
                    <div className="dv2-header-actions">
                        <button onClick={() => setShowSimControls(!showSimControls)}>
                            📊 {showSimControls ? 'Hide Controls' : 'Sim Controls'}
                        </button>
                        <button
                            className="dv2-btn-primary"
                            onClick={() => window.location.href = '/tests'}
                        >
                            🧪 Take Assessment
                        </button>
                    </div>
                </header>

                {/* Simulation Controls (dev) */}
                {showSimControls && (
                    <div className="dv2-section">
                        <SimulationControls />
                    </div>
                )}

                {!vm.hasData ? (
                    /* Empty State */
                    <div className="dv2-card dv2-empty-state dv2-animate-in">
                        <div className="dv2-empty-icon">🧠</div>
                        <h3>Welcome to VyomFlow</h3>
                        <p>Complete your first cognitive assessment to see your personalized health dashboard.</p>
                        <button onClick={() => window.location.href = '/tests'}>
                            Take Your First Assessment
                        </button>
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

                        {/* Section 3: Domain Scores */}
                        <div className="dv2-section">
                            <DomainScoreCards domains={vm.domainScores} />
                        </div>

                        {/* Section 3b: Radar Chart */}
                        <div className="dv2-section">
                            <CognitiveRadarSection scores={vm.radarScores} />
                        </div>

                        {/* Section 5: Change Since Last Visit */}
                        <div className="dv2-section">
                            <ChangesSinceLastVisit changes={vm.changes} />
                        </div>

                        {/* Section 4: Module Trend Charts */}
                        <div className="dv2-section">
                            <ModuleTrendCharts
                                trends={vm.moduleTrends}
                                onPointClick={handleChartPointClick}
                            />
                        </div>

                        {/* Section 6: Assessment Module Cards */}
                        <div className="dv2-section">
                            <AssessmentModuleCards modules={vm.assessmentModules} />
                        </div>

                        {/* Section 7: Explainability */}
                        <div className="dv2-section">
                            <ExplainabilitySection explainability={vm.explainability} />
                        </div>

                        {/* Section 8: Longitudinal Summary */}
                        <div className="dv2-section">
                            <LongitudinalSummary longitudinal={vm.longitudinal} />
                        </div>

                        {/* Section 9: Recommendation */}
                        <div className="dv2-section">
                            <RecommendationCard
                                recommendation={vm.recommendation}
                                onOpenReport={() => setIsReportOpen(true)}
                            />
                        </div>
                    </>
                )}

                {/* Biomarker Drill-Down Drawer */}
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
