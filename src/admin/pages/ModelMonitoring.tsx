/**
 * Model Monitoring Page
 * ML model performance metrics and anomaly detection stats.
 */

import { useState, useEffect } from 'react';

import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardHeader, CardContent } from '../../components/common';
import './ModelMonitoring.css';

interface ModelStats {
    flaggedSessions: number;
    avgTrendConfidence: number;
    anomalyRate: number;
    featureImportance: { feature: string; importance: number }[];
}

import { MOCK_MODEL_STATS } from '../data/mockData';

export function ModelMonitoring() {
    const [stats, setStats] = useState<ModelStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use centralized mock data
        setStats(MOCK_MODEL_STATS);
        setLoading(false);
    }, []);

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <header className="admin-header">
                    <h1>Model Monitoring</h1>
                </header>

                {loading ? (
                    <div className="admin-loading">Loading model stats...</div>
                ) : (
                    <>
                        <div className="model-metrics-grid">
                            <Card className="model-metric-card">
                                <CardContent>
                                    <div className="model-metric">
                                        <span className="metric-label">Flagged Sessions</span>
                                        <span className="metric-value warning">
                                            {stats?.flaggedSessions || 0}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="model-metric-card">
                                <CardContent>
                                    <div className="model-metric">
                                        <span className="metric-label">Avg Trend Confidence</span>
                                        <span className="metric-value">
                                            {((stats?.avgTrendConfidence || 0) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="model-metric-card">
                                <CardContent>
                                    <div className="model-metric">
                                        <span className="metric-label">Anomaly Rate</span>
                                        <span className="metric-value">
                                            {((stats?.anomalyRate || 0) * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="feature-importance-card">
                            <CardHeader title="Feature Importance" />
                            <CardContent>
                                <div className="feature-list">
                                    {stats?.featureImportance.map((item) => (
                                        <div key={item.feature} className="feature-item">
                                            <span className="feature-name">{item.feature}</span>
                                            <div className="feature-bar-container">
                                                <div
                                                    className="feature-bar"
                                                    style={{ width: `${item.importance * 100}%` }}
                                                />
                                            </div>
                                            <span className="feature-value">
                                                {(item.importance * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="model-info-card">
                            <CardHeader title="Model Information" />
                            <CardContent>
                                <div className="model-info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Model Type</span>
                                        <span className="info-value">Hybrid (Rule-based + ML)</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Trend Analysis</span>
                                        <span className="info-value">Linear Regression + LSTM</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Anomaly Detection</span>
                                        <span className="info-value">Z-Score + Isolation Forest</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Risk Scoring</span>
                                        <span className="info-value">Weighted Feature Sum</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}
