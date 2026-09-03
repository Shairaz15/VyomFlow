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
import { useReactionResults, useMemoryResults, usePatternResults, useLanguageResults, useVmraResults, useStoryResults, clearAllTestData } from "../hooks/useTestResults";
import { generateSimulatedData, hasBaseline, getMockBaseline } from "../utils/simulateUserData";
import { useWeeklyReminder } from "../hooks/useWeeklyReminder";
import { predictTrend } from "../ml";
import type { TrendPrediction } from "../ml";
import { logger } from "../utils/logger";
import { useLanguage } from "../i18n/LanguageContext";
import "./Dashboard.css";

// ... inside Dashboard component ...





export function Dashboard() {
    // Load test results (all from hooks — hooks handle Firestore vs localStorage)
    const { results: reactionResults, saveResult: saveReaction } = useReactionResults();
    const { results: memoryResults, saveResult: saveMemory } = useMemoryResults();
    const { results: patternResults, saveResult: savePattern } = usePatternResults();
    const { results: languageResults, saveResult: saveLanguage } = useLanguageResults();
    const { results: vmraResults, saveResult: saveVmra } = useVmraResults();
    const { results: storyResults } = useStoryResults();

    // Weekly Reminder Hook
    useWeeklyReminder();

    // Auth (kept for potential future use)
    useAuth();
    const { t } = useLanguage();

    // ML Prediction State
    const [mlPrediction, setMlPrediction] = useState<TrendPrediction | null>(null);

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
        } catch (error) {
            logger.error("Failed to save simulated data:", error);
            alert(t('dashboard.simFailed'));
        }
    };

    // Determine if user has data
    const hasUserData = reactionResults.length > 0 || memoryResults.length > 0 || patternResults.length > 0 || languageResults.length > 0 || vmraResults.length > 0 || storyResults.length > 0;

    // Prepare chart data
    const chartData = useMemo(() => {
        const allDates = new Set<string>();
        reactionResults.forEach(r => allDates.add(new Date(r.timestamp).toDateString()));
        memoryResults.forEach(m => allDates.add(new Date(m.timestamp).toDateString()));
        patternResults.forEach(p => allDates.add(new Date(p.timestamp).toDateString()));
        languageResults.forEach(l => allDates.add(new Date(l.timestamp).toDateString()));
        vmraResults.forEach(v => allDates.add(new Date(v.timestamp).toDateString()));
        storyResults.forEach(s => allDates.add(new Date(s.timestamp).toDateString()));

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        return sortedDates.map((dateStr, index) => {
            const reaction = reactionResults.filter(r => new Date(r.timestamp).toDateString() === dateStr).pop();
            const memory = memoryResults.filter(m => new Date(m.timestamp).toDateString() === dateStr).pop();
            const pattern = patternResults.filter(p => new Date(p.timestamp).toDateString() === dateStr).pop();
            const language = languageResults.filter(l => new Date(l.timestamp).toDateString() === dateStr).pop();
            const vmra = vmraResults.filter(v => new Date(v.timestamp).toDateString() === dateStr).pop();
            const storyRes = storyResults.filter(s => new Date(s.timestamp).toDateString() === dateStr).pop();

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
            };
        });
    }, [reactionResults, memoryResults, patternResults, languageResults, vmraResults, storyResults]);

    // Fetch ML Prediction when enough data
    useEffect(() => {
        let mounted = true;
        async function fetchML() {
            if (chartData.length >= 3) {
                // Build features for ML model
                const dataPoints = chartData.map((session, index) => {
                    const langResult = languageResults[index] || languageResults[languageResults.length - 1];
                    return {
                        timestamp: new Date().getTime() - (chartData.length - index - 1) * 7 * 24 * 60 * 60 * 1000,
                        features: {
                            memoryAccuracy: (session.memory || 70) / 100,
                            reactionTimeAvg: session.reaction || 350,
                            reactionTimeVariance: 500,
                            patternScore: session.pattern || 50,
                            speechWPM: session.speech || 120,
                            lexicalDiversity: langResult?.derivedFeatures?.lexicalDiversity ?? 0.6,
                            fillerWordRatio: langResult?.derivedFeatures?.hesitationIndex ?? 0.05,
                            hesitationMarkers: langResult?.rawMetrics?.pauseCount ?? 2,
                        }
                    };
                });

                try {
                    const pred = await predictTrend(dataPoints);
                    if (mounted) {
                        setMlPrediction(pred);
                    }
                } catch (err) {
                    logger.error('Error in predictTrend:', err);
                }
            } else {
                if (mounted) setMlPrediction(null);
            }
        }
        fetchML();
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
                                connectNulls
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ fill: color }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <PageWrapper>
            <div className="dashboard container">
                <div className="dashboard-header">
                    <div>
                        <h1>{t('dashboard.title')}</h1>
                        <p className="text-secondary">
                            {t('dashboard.subtitle')}
                        </p>
                    </div>
                    <div className="dashboard-header-actions">
                        <button
                            className={`mode-toggle ${showSimControls ? 'demo-active' : ''}`}
                            onClick={() => setShowSimControls(prev => !prev)}
                            title="Toggle demo data simulation controls"
                        >
                            <Icon name="chart-trend" size={14} />
                            {' '}{showSimControls ? t('dashboard.hideSimControls') : t('dashboard.showSimControls')}
                        </button>
                        <Button variant="primary" onClick={() => window.location.href = "/tests"}>
                            {t('dashboard.takeNewAssessment')}
                        </Button>
                    </div>
                </div>

                {/* Simulation Controls - Toggle for anyone */}
                {showSimControls && (
                    <Card className="simulation-controls">
                        <CardHeader
                            title={t('dashboard.dataControlsTitle')}
                            subtitle={t('dashboard.dataControlsSubtitle')}
                        />
                        <CardContent>
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

                            <div className="simulation-buttons mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-sm font-medium text-secondary mb-2 w-full">{t('dashboard.mockNoBaseline')}</h4>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleMockData("declining")}
                                    className="simulate-decline-btn"
                                >
                                    <Icon name="chart-trend" size={16} />
                                    {t('dashboard.mockDeclining')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleMockData("stable")}
                                    className="simulate-stable-btn"
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

                {/* Your Trend Analysis - Shows when 3+ sessions and ML prediction exists */}
                {chartData.length >= 3 && mlPrediction && (
                    <Card className="risk-summary animate-fadeIn">
                        <div className="risk-summary-header">
                            <div>
                                <h2>{t('dashboard.trendAnalysis')}</h2>
                                <RiskBadge level={
                                    mlPrediction.direction === 'declining' ? 'possible_risk' :
                                        mlPrediction.direction === 'improving' ? 'stable' : 'change_detected'
                                } />
                            </div>
                            <div className="risk-confidence">
                                <span className="label">{t('dashboard.mlConfidence')}</span>
                                <span className="value">
                                    {Math.round(mlPrediction.confidence * 100)}%
                                </span>
                            </div>
                        </div>
                        <p className="risk-message">
                            {mlPrediction.direction === 'declining'
                                ? t('dashboard.riskDeclining')
                                : mlPrediction.direction === 'improving'
                                    ? t('dashboard.riskImproving')
                                    : t('dashboard.riskStable')}
                        </p>
                        <div className="risk-factors">
                            <span className="factors-label">{t('dashboard.trendDetected')}</span>
                            <div className="factors-list">
                                <span className={`factor-tag direction-tag ${mlPrediction.direction}`}>
                                    {mlPrediction.direction === 'improving' ? '↗' :
                                        mlPrediction.direction === 'declining' ? '↘' : '↔'} {mlPrediction.direction}
                                </span>
                                <span className="factor-tag">
                                    {t('dashboard.sessionsAnalyzed', { count: String(chartData.length) })}
                                </span>
                            </div>
                        </div>
                    </Card>
                )}

                {/* No data message */}
                {!hasUserData && (
                    <Card className="no-data-card">
                        <CardContent>
                            <div className="no-data-message">
                                <div className="no-data-icon">
                                    <Icon name="chart-line-up" size={64} />
                                </div>
                                <h3>{t('dashboard.noDataTitle')}</h3>
                                <p>{t('dashboard.noDataDesc')}</p>
                                <Button variant="primary" onClick={() => window.location.href = "/tests"}>
                                    {t('dashboard.takeFirstTest')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Charts Grid */}
                {hasUserData && (
                    <div className="charts-grid">
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


            </div>
        </PageWrapper>
    );
}
