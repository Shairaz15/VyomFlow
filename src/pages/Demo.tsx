import { useState } from 'react';
import { DEMO_SESSIONS, getDemoSessionDataPoints } from '../demo/demoSessions';
import { DEMO_USER } from '../demo/demoProfile';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button, Card, CardContent, RiskBadge } from '../components/common';
import { analyzeTrend } from '../ai/trendAnalyzer';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import type { RiskLevel } from '../ethics/messagingRules';
import './Demo.css';

export function Demo() {
    const { t } = useLanguage();
    const [selectedMetric, setSelectedMetric] = useState<'memory' | 'reaction' | 'pattern'>('memory');

    const dataPoints = getDemoSessionDataPoints();
    const trendResult = analyzeTrend(dataPoints);

    // Map internal trend risk to UI RiskLevel
    const riskLevel: RiskLevel =
        trendResult.risk === 'high' ? 'possible_risk' :
            trendResult.risk === 'medium' ? 'change_detected' : 'stable';

    const chartData = DEMO_SESSIONS.map((session) => ({
        date: session.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        memory: Math.round(session.features.memoryAccuracy * 100),
        reaction: session.features.reactionTimeAvg,
        pattern: session.features.patternScore,
    }));

    const metricConfig = {
        memory: { label: t('demo.memoryAccuracy'), color: '#8b5cf6', unit: '%' },
        reaction: { label: t('demo.reactionTime'), color: '#f59e0b', unit: 'ms' },
        pattern: { label: t('demo.patternScore'), color: '#10b981', unit: '' },
    };

    return (
        <PageWrapper>
            <div className="demo-page">
                <header className="demo-header">
                    <div className="demo-badge">{t('demo.badge')}</div>
                    <h1>{t('demo.title')}</h1>
                    <p>
                        {t('demo.viewingData', { name: DEMO_USER.name })}
                    </p>
                </header>

                <div className="demo-grid">
                    <Card className="trend-card">
                        <div className="card-header">
                            <h3 className="card-title">{t('demo.trendAnalysis')}</h3>
                            <RiskBadge level={riskLevel} />
                        </div>
                        <CardContent>
                            <div className="trend-summary">
                                <div className="trend-item">
                                    <span className="trend-label">{t('demo.direction')}</span>
                                    <span className={`trend-value ${trendResult.trend}`}>
                                        {trendResult.trend === 'declining' ? t('demo.declining') :
                                            trendResult.trend === 'improving' ? t('demo.improving') : t('demo.stable')}
                                    </span>
                                </div>
                                <div className="trend-item">
                                    <span className="trend-label">{t('demo.confidence')}</span>
                                    <span className="trend-value">
                                        {Math.round(trendResult.confidence * 100)}%
                                    </span>
                                </div>
                                <div className="trend-item">
                                    <span className="trend-label">{t('demo.sessionsLabel')}</span>
                                    <span className="trend-value">{DEMO_SESSIONS.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="chart-card">
                        <div className="card-header">
                            <h3 className="card-title">{t('demo.performanceOverTime')}</h3>
                            <div className="metric-selector">
                                {Object.entries(metricConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        className={`metric-btn ${selectedMetric === key ? 'active' : ''}`}
                                        onClick={() => setSelectedMetric(key as typeof selectedMetric)}
                                        style={{ '--metric-color': config.color } as React.CSSProperties}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <CardContent>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                        <YAxis stroke="#888" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey={selectedMetric}
                                            stroke={metricConfig[selectedMetric].color}
                                            strokeWidth={2}
                                            dot={{ fill: metricConfig[selectedMetric].color, r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <section className="demo-info">
                    <h3>{t('demo.aboutTitle')}</h3>
                    <p>
                        {t('demo.aboutDesc1')}
                    </p>
                    <p>
                        {t('demo.aboutDesc2')}
                    </p>
                    <div className="demo-actions">
                        <Button variant="primary" onClick={() => window.location.href = '/'}>
                            {t('demo.tryVyomflow')}
                        </Button>
                    </div>
                </section>
            </div>
        </PageWrapper>
    );
}
