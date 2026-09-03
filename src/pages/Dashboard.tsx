import { useMemo, useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent, RiskBadge, Button, Icon } from "../components/common";
import { PageWrapper } from "../components/layout";
import { useAuth } from "../contexts/AuthContext";
import { useReactionResults, useMemoryResults, usePatternResults, useLanguageResults, useVmraResults, useStoryResults, useNavigationResults, clearAllTestData } from "../hooks/useTestResults";
import { generateSimulatedData, hasBaseline, getMockBaseline } from "../utils/simulateUserData";
import { useWeeklyReminder } from "../hooks/useWeeklyReminder";
import { evaluateLongitudinalDrift } from "../services/statisticalDriftEngine";
import { generateClinicalAlert } from "../services/clinicalAlertEngine";
import { evaluateCrossSectionalRisk } from "../services/clinicalModelEngine";
import { mapToSessionData, type RawDashboardData } from "../services/dataMapper";
import { logger } from "../utils/logger";
import { useLanguage } from "../i18n/LanguageContext";
import { ClinicalAlertCard } from "../components/dashboard/ClinicalAlertCard";
import { LongitudinalTrajectoryCard } from "../components/dashboard/LongitudinalTrajectoryCard";
import { ClinicianReportModal } from "../components/dashboard/ClinicianReportModal";
import { evaluatePatientTrajectory } from "../services/statisticalDriftEngine";
import { determineClinicalAlert } from "../services/clinicalAlertService";
import "./Dashboard.css";

export function Dashboard() {
    // Load test results (all from hooks — hooks handle Firestore vs localStorage)
    const { results: reactionResults, saveResult: saveReaction } = useReactionResults();
    const { results: memoryResults, saveResult: saveMemory } = useMemoryResults();
    const { results: patternResults, saveResult: savePattern } = usePatternResults();
    const { results: languageResults, saveResult: saveLanguage } = useLanguageResults();
    const { results: vmraResults, saveResult: saveVmra } = useVmraResults();
    const { results: storyResults, saveResult: saveStory } = useStoryResults();
    const { results: navigationResults, saveResult: saveNavigation } = useNavigationResults();

    // Weekly Reminder Hook
    useWeeklyReminder();

    // Auth (kept for potential future use)
    useAuth();
    const { t } = useLanguage();

    // Clinical Alert & Modal State
    const [clinicalAlert, setClinicalAlert] = useState<any>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Simulation Controls Toggle
    const [showSimControls, setShowSimControls] = useState(false);

    // Refresh data from localStorage (used after simulation)
    const refreshData = () => {
        window.location.reload();
    };

    // Handle Clear All Data
    const handleClearData = async () => {
        if (window.confirm(t('dashboard.confirmDelete'))) {
            await clearAllTestData();
            refreshData();
        }
    };

    // Handle Mock Data (No Baseline Required)
    const handleMockData = async (pattern: "stable" | "declining") => {
        const baseline = getMockBaseline();
        const simulated = generateSimulatedData(baseline, pattern);

        try {
            if (simulated.reaction.length > 0) simulated.reaction.forEach(r => saveReaction(r));
            if (simulated.memory.length > 0) simulated.memory.forEach(r => saveMemory(r));
            if (simulated.pattern.length > 0) simulated.pattern.forEach(r => savePattern(r));
            if (simulated.language.length > 0) simulated.language.forEach(r => saveLanguage(r));
            if (simulated.vmra.length > 0) simulated.vmra.forEach(r => saveVmra(r));
            if (simulated.story.length > 0) simulated.story.forEach(r => saveStory(r));
            if (simulated.navigation.length > 0) simulated.navigation.forEach(r => saveNavigation(r));
            setTimeout(refreshData, 150);
        } catch (error) {
            logger.error("Failed to save mock data:", error);
            alert(t('dashboard.mockFailed'));
        }
    };

    // Handle Simulate Data
    const handleSimulateData = async (pattern: "stable" | "declining") => {
        const baseline = {
            reaction: reactionResults.length > 0 ? reactionResults[reactionResults.length - 1] : undefined,
            memory: memoryResults.length > 0 ? memoryResults[memoryResults.length - 1] : undefined,
            pattern: patternResults.length > 0 ? patternResults[patternResults.length - 1] : undefined,
            language: languageResults.length > 0 ? languageResults[languageResults.length - 1] : undefined,
            vmra: vmraResults.length > 0 ? vmraResults[vmraResults.length - 1] : undefined,
            story: storyResults.length > 0 ? storyResults[storyResults.length - 1] : undefined,
            navigation: navigationResults.length > 0 ? navigationResults[navigationResults.length - 1] : undefined,
        };

        if (!hasBaseline(baseline)) {
            alert(t('dashboard.baselineRequired'));
            return;
        }

        const simulated = generateSimulatedData(baseline, pattern);

        try {
            if (simulated.reaction.length > 0) simulated.reaction.forEach(r => saveReaction(r));
            if (simulated.memory.length > 0) simulated.memory.forEach(r => saveMemory(r));
            if (simulated.pattern.length > 0) simulated.pattern.forEach(r => savePattern(r));
            if (simulated.language.length > 0) simulated.language.forEach(r => saveLanguage(r));
            if (simulated.vmra.length > 0) simulated.vmra.forEach(r => saveVmra(r));
            if (simulated.story.length > 0) simulated.story.forEach(r => saveStory(r));
            if (simulated.navigation.length > 0) simulated.navigation.forEach(r => saveNavigation(r));
            setTimeout(refreshData, 150);
        } catch (error) {
            logger.error("Failed to save simulated data:", error);
            alert(t('dashboard.simFailed'));
        }
    };

    // Determine if user has data
    const hasUserData = reactionResults.length > 0 || memoryResults.length > 0 || patternResults.length > 0 || languageResults.length > 0 || vmraResults.length > 0 || storyResults.length > 0 || navigationResults.length > 0;

    // Prepare chart data
    const chartData = useMemo(() => {
        const allDates = new Set<string>();
        reactionResults.forEach(r => allDates.add(new Date(r.timestamp).toDateString()));
        memoryResults.forEach(m => allDates.add(new Date(m.timestamp).toDateString()));
        patternResults.forEach(p => allDates.add(new Date(p.timestamp).toDateString()));
        languageResults.forEach(l => allDates.add(new Date(l.timestamp).toDateString()));
        vmraResults.forEach(v => allDates.add(new Date(v.timestamp).toDateString()));
        storyResults.forEach(s => allDates.add(new Date(s.timestamp).toDateString()));
        navigationResults.forEach(n => allDates.add(new Date(n.timestamp).toDateString()));

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return sortedDates.map((dateStr, index) => {
            const reaction = reactionResults.filter(r => new Date(r.timestamp).toDateString() === dateStr).pop();
            const memory = memoryResults.filter(m => new Date(m.timestamp).toDateString() === dateStr).pop();
            const pattern = patternResults.filter(p => new Date(p.timestamp).toDateString() === dateStr).pop();
            const language = languageResults.filter(l => new Date(l.timestamp).toDateString() === dateStr).pop();
            const vmra = vmraResults.filter(v => new Date(v.timestamp).toDateString() === dateStr).pop();
            const storyRes = storyResults.filter(s => new Date(s.timestamp).toDateString() === dateStr).pop();
            const navRes = navigationResults.filter(n => new Date(n.timestamp).toDateString() === dateStr).pop();

            const patternScore = pattern ? Math.min(pattern.metrics.maxLevelReached * 10, 100) : null;

            return {
                name: `${t('dashboard.session')} ${index + 1}`,
                date: new Date(dateStr).toLocaleDateString('en-GB'),
                memory: memory ? Math.round(memory.accuracy * 100) : null,
                reaction: reaction ? Math.round(reaction.aggregates.avg) : null,
                pattern: patternScore,
                speech: language ? Math.round(language.derivedFeatures.wpm) : null,
                csi: language ? Math.round(language.derivedFeatures.cognitiveSpeechIndex ?? 85) : null,
                vmra: vmra ? Math.round(vmra.features.recallAccuracy * 100) : null,
                storyRecall: storyRes ? storyRes.storyRecallScore : null,
                navigation: navRes ? navRes.navigationScore : null,
            };
        });
    }, [reactionResults, memoryResults, patternResults, languageResults, vmraResults, storyResults, navigationResults]);

    // Prepare session points for statistical drift engine
    const sessionPoints = useMemo(() => {
        return chartData.map((session, index) => {
            const timestamp = new Date().getTime() - (chartData.length - index - 1) * 14 * 24 * 60 * 60 * 1000;
            const memoryVal = session.vmra ?? session.memory ?? 80;
            const navVal = session.navigation ?? 80;
            const langVal = session.csi ?? 85;
            const attnVal = session.reaction ? Math.min(100, Math.max(0, 100 - (session.reaction - 250) / 4)) : 85;
            const compositeScore = Math.round(memoryVal * 0.3 + navVal * 0.25 + langVal * 0.25 + attnVal * 0.2);

            return {
                timestamp,
                score: compositeScore,
                domainScores: {
                    memory: memoryVal,
                    navigation: navVal,
                    language: langVal,
                    attention: attnVal,
                }
            };
        });
    }, [chartData]);

    const evaluation = useMemo(() => {
        return evaluatePatientTrajectory(sessionPoints);
    }, [sessionPoints]);

    const latestSession = chartData.length > 0 ? chartData[chartData.length - 1] : null;

    const latestScores = useMemo(() => ({
        memory: latestSession?.vmra ?? latestSession?.memory ?? 85,
        navigation: latestSession?.navigation ?? 82,
        language: latestSession?.csi ?? 86,
        story: latestSession?.storyRecall ?? 80,
        reaction: latestSession?.reaction ?? 280,
        pattern: latestSession?.pattern ?? 75,
        savt: latestSession?.reaction ? Math.min(100, Math.max(0, Math.round(100 - (latestSession.reaction - 250) / 4))) : 88,
    }), [latestSession]);

    const alertContext = useMemo(() => ({
        completedModulesCount: Math.min(6, (reactionResults.length > 0 ? 1 : 0) + (vmraResults.length > 0 || memoryResults.length > 0 ? 1 : 0) + (languageResults.length > 0 ? 1 : 0) + (navigationResults.length > 0 ? 1 : 0) + (storyResults.length > 0 ? 1 : 0) + (patternResults.length > 0 ? 1 : 0)),
        sessionHistoryCount: chartData.length || 1,
        estimatedMoCA: latestScores.memory ? Math.round((latestScores.memory / 100) * 30 * 10) / 10 : 28.5,
        trajectory: evaluation.trajectory,
        predictionProbabilities: clinicalAlert?.crossSectionalRisk ? {
            normal: clinicalAlert.crossSectionalRisk[0],
            mci: clinicalAlert.crossSectionalRisk[1],
            dementia: clinicalAlert.crossSectionalRisk[2]
        } : undefined
    }), [reactionResults, vmraResults, memoryResults, languageResults, navigationResults, storyResults, patternResults, chartData, latestScores, evaluation, clinicalAlert]);

    const alertDecision = useMemo(() => determineClinicalAlert(alertContext), [alertContext]);

    // Fetch Clinical Engine Output (Cross-sectional ONNX + Longitudinal drift)
    useEffect(() => {
        let mounted = true;
        async function fetchClinicalAlert() {
            if (chartData.length >= 1) { 
                const rawData: RawDashboardData = {
                    reaction: reactionResults,
                    memory: memoryResults,
                    pattern: patternResults,
                    language: languageResults,
                    vmra: vmraResults,
                    story: storyResults,
                    navigation: navigationResults
                };

                const sessions = mapToSessionData(rawData);
                
                try {
                    let driftMetrics = null;
                    if (sessions.length >= 2) {
                        driftMetrics = evaluateLongitudinalDrift(sessions, 10);
                    }

                    // Cross-sectional risk requires all raw data to extract features
                    const crossRisk = await evaluateCrossSectionalRisk(rawData);
                    const impairmentRisk = 1 - crossRisk[0]; // 1 - Normal probability
                    
                    // Alert engine takes longitudinal trajectory + cross-sectional risk
                    const alertOutput = generateClinicalAlert(
                        driftMetrics ? driftMetrics.overallTrajectory : 'STABLE',
                        impairmentRisk,
                        { 
                            density: 100, 
                            completeness: 100, 
                            oodDistance: 100, 
                            uncertainty: 100, 
                            history: sessions.length >= 3 ? 100 : (sessions.length === 2 ? 60 : 30)
                        }
                    );

                    // Attach for UI rendering
                    (alertOutput as any).crossSectionalRisk = crossRisk;

                    if (mounted) {
                        setClinicalAlert(alertOutput);
                    }
                } catch (err) {
                    logger.error('Error in clinical engines:', err);
                }
            } else {
                if (mounted) setClinicalAlert(null);
            }
        }
        fetchClinicalAlert();
        return () => { mounted = false; };
    }, [chartData]);

    // Chart Component
    const renderChart = (title: string, subtitle: string, dataKey: string, color: string, domain: [number | 'auto', number | 'auto'] = ['auto', 'auto'], unit: string = "") => (
        <Card className="chart-card">
            <CardHeader title={title} subtitle={subtitle} />
            <CardContent>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis domain={domain} stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e293b",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                }}
                                formatter={(value) => [String(value ?? '') + unit, title]}
                            />
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ fill: color, r: 4 }}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <PageWrapper>
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="header-left">
                        <h1>{t('dashboard.title')}</h1>
                        <p>{t('dashboard.subtitle')}</p>
                    </div>
                    <div className="header-actions">
                        <Button
                            variant="secondary"
                            onClick={() => setShowSimControls(!showSimControls)}
                            className="sim-toggle-btn"
                            title={t('dashboard.toggleSimControls')}
                        >
                            <Icon name="chart-trend" size={18} />
                            {showSimControls ? t('dashboard.hideSimControls') : t('dashboard.showSimControls')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => window.location.href = "/"}
                        >
                            {t('dashboard.takeAssessment')}
                        </Button>
                    </div>
                </div>

                {/* Simulation Controls Card */}
                {showSimControls && (
                    <Card className="simulation-controls-card animate-fadeIn">
                        <CardHeader
                            title={t('dashboard.demoSimulation')}
                            subtitle={t('dashboard.demoSimulationSub')}
                        />
                        <CardContent>
                            <div className="simulation-section-label">
                                <span>{t('dashboard.basedOnBaseline')}</span>
                            </div>
                            <div className="simulation-buttons">
                                <Button
                                    variant="secondary"
                                    onClick={handleClearData}
                                    className="clear-data-btn"
                                >
                                    <Icon name="trash" size={16} />
                                    {t('dashboard.clearAllData')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleSimulateData("declining")}
                                    className="simulate-decline-btn"
                                >
                                    <Icon name="chart-trend" size={16} />
                                    {t('dashboard.decliningBaseline')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleSimulateData("stable")}
                                    className="simulate-stable-btn"
                                >
                                    <Icon name="chart-line-up" size={16} />
                                    {t('dashboard.stableBaseline')}
                                </Button>
                            </div>

                            <div className="simulation-section-label" style={{ marginTop: '1rem' }}>
                                <span>{t('dashboard.withoutBaseline')}</span>
                            </div>
                            <div className="simulation-buttons">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleMockData("declining")}
                                    className="mock-decline-btn"
                                >
                                    <Icon name="chart-trend" size={16} />
                                    {t('dashboard.mockDeclining')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleMockData("stable")}
                                    className="mock-stable-btn"
                                >
                                    <Icon name="chart-line-up" size={16} />
                                    {t('dashboard.mockStable')}
                                </Button>
                            </div>
                            <p className="simulation-hint">
                                <Icon name="info" size={14} />
                                {hasUserData
                                    ? ` ${t('dashboard.sessionsRecorded', { count: String(chartData.length) })}`
                                    : ` ${t('dashboard.takeFirstBaseline')}`}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Clinical Decision Support & Statistical Longitudinal Drift Cards */}
                {hasUserData && (
                    <div className="space-y-4 mb-4 animate-fadeIn">
                        <ClinicalAlertCard
                            completedModulesCount={alertContext.completedModulesCount}
                            sessionHistoryCount={alertContext.sessionHistoryCount}
                            estimatedMoCA={alertContext.estimatedMoCA}
                            predictionProbabilities={alertContext.predictionProbabilities}
                            trajectory={evaluation.trajectory}
                            onOpenClinicianReport={() => setIsReportModalOpen(true)}
                        />

                        <LongitudinalTrajectoryCard sessionPoints={sessionPoints} />
                    </div>
                )}

                {/* Cross-Sectional & Longitudinal Risk Card */}
                {clinicalAlert && (
                    <Card className="risk-summary animate-fadeIn">
                        <div className="risk-summary-header">
                            <div>
                                <h2>{t('dashboard.trendAnalysis')}</h2>
                                <RiskBadge level={
                                    clinicalAlert.alertLevel === 'EVALUATE' ? 'possible_risk' :
                                    clinicalAlert.alertLevel === 'RE_ASSESS' ? 'change_detected' :
                                    clinicalAlert.alertLevel === 'MONITOR' ? 'change_detected' : 'stable'
                                } />
                            </div>
                            <div className="risk-confidence">
                                <span className="label">Confidence Score</span>
                                <span className="value">
                                    {Math.round(clinicalAlert.confidenceScore)}%
                                </span>
                            </div>
                        </div>
                        <p className="risk-message text-lg font-medium text-white mb-4">
                            {clinicalAlert.recommendationText}
                        </p>
                        {clinicalAlert.crossSectionalRisk && (
                            <div className="risk-factors">
                                <span className="factors-label">Detected Status probabilities:</span>
                                <div className="factors-list">
                                    <span className="factor-tag">
                                        Normal: {Math.round(clinicalAlert.crossSectionalRisk[0]*100)}%
                                    </span>
                                    <span className="factor-tag">
                                        MCI: {Math.round(clinicalAlert.crossSectionalRisk[1]*100)}%
                                    </span>
                                    <span className="factor-tag">
                                        Dementia: {Math.round(clinicalAlert.crossSectionalRisk[2]*100)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* No data message */}
                {!hasUserData && (
                    <Card className="no-data-card">
                        <CardContent>
                            <div className="no-data-content">
                                <Icon name="chart-line-up" size={48} className="no-data-icon" />
                                <h3>{t('dashboard.noDataTitle')}</h3>
                                <p>{t('dashboard.noDataDesc')}</p>
                                <Button
                                    variant="primary"
                                    onClick={() => window.location.href = "/"}
                                >
                                    {t('dashboard.takeAssessment')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Charts Grid */}
                {hasUserData && (
                    <div className="charts-grid">
                        {renderChart("Immersive Navigation", "Visuospatial memory & route wayfinding index", "navigation", "#06b6d4", [0, 100], "/100")}
                        {renderChart("Story Narration Recall", "Episodic memory & narrative recall index", "storyRecall", "#60a5fa", [0, 100], "/100")}
                        {renderChart(t('dashboard.memoryAccuracy'), t('dashboard.memoryAccuracySub'), "memory", "#34d399", [0, 100], "%")}
                        {renderChart(t('dashboard.visualMemoryVmra'), t('dashboard.visualMemoryVmraSub'), "vmra", "#f472b6", [0, 100], "%")}
                        {renderChart(t('dashboard.reactionTime'), t('dashboard.reactionTimeSub'), "reaction", "#fbbf24", ['auto', 'auto'], "ms")}
                        {renderChart(t('dashboard.patternRecognition'), t('dashboard.patternRecognitionSub'), "pattern", "#38bdf8", [0, 100], "%")}
                        {renderChart("Cognitive Speech Index (CSI)", "Multilingual linguistic & acoustic composite", "csi", "#c084fc", [0, 100], "/100")}
                        {renderChart(t('dashboard.speechRate'), t('dashboard.speechRateSub'), "speech", "#a78bfa", ['auto', 'auto'], " wpm")}
                    </div>
                )}

                {/* Session History Table */}
                {hasUserData && (
                    <Card className="session-history">
                        <CardHeader title={t('dashboard.sessionHistory')} subtitle={t('dashboard.sessionHistorySub')} />
                        <CardContent>
                            <div className="session-table-wrapper">
                                <table className="session-table">
                                    <thead>
                                        <tr>
                                            <th>{t('dashboard.date')}</th>
                                            <th>Navigation</th>
                                            <th>Story Recall</th>
                                            <th>{t('dashboard.memory')}</th>
                                            <th>{t('dashboard.visual')}</th>
                                            <th>{t('dashboard.reaction')}</th>
                                            <th>{t('dashboard.pattern')}</th>
                                            <th>CSI Score</th>
                                            <th>{t('dashboard.speechWpm')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chartData.slice().reverse().map((session, i) => (
                                            <tr key={i}>
                                                <td>{session.date}</td>
                                                <td>{session.navigation ? `${session.navigation}/100` : '-'}</td>
                                                <td>{session.storyRecall ? `${session.storyRecall}/100` : '-'}</td>
                                                <td>{session.memory ? `${session.memory}%` : '-'}</td>
                                                <td>{session.vmra ? `${session.vmra}%` : '-'}</td>
                                                <td>{session.reaction ? `${session.reaction}ms` : '-'}</td>
                                                <td>{session.pattern ? `${session.pattern}%` : '-'}</td>
                                                <td>{session.csi ? `${session.csi}/100` : '-'}</td>
                                                <td>{session.speech ? session.speech : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Clinician Summary Report Modal */}
                <ClinicianReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    alertDecision={alertDecision}
                    evaluation={evaluation}
                    latestScores={latestScores}
                />
            </div>
        </PageWrapper>
    );
}
