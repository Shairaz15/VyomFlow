/**
 * Admin Dashboard Page
 * Overview of system metrics, reading from precomputed adminAnalytics/.
 */

import { useState, useEffect } from 'react';
import { MOCK_DASHBOARD_METRICS } from '../data/mockData';
import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardHeader, CardContent } from '../../components/common';
import './AdminDashboard.css';

interface GlobalMetrics {
    totalUsers: number;
    totalSessions: number;
    avgMemoryScore: number;
    avgReactionTime: number;
    riskDistribution: { low: number; medium: number; high: number };
    sessionsToday: number;
    lastUpdated: Date | null;
}

export function AdminDashboard() {
    const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use centralized mock data directly as requested
        setMetrics(MOCK_DASHBOARD_METRICS);
        setLoading(false);
    }, []);

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <header className="admin-header">
                    <h1>Admin Dashboard</h1>
                    {metrics?.lastUpdated && (
                        <span className="last-updated">
                            Updated: {metrics.lastUpdated.toLocaleString()}
                        </span>
                    )}
                </header>

                {loading ? (
                    <div className="admin-loading">Loading metrics...</div>
                ) : (
                    <>
                        <div className="metrics-grid">
                            <MetricCard
                                title="Total Users"
                                value={metrics?.totalUsers || 0}
                                icon="👥"
                            />
                            <MetricCard
                                title="Total Sessions"
                                value={metrics?.totalSessions || 0}
                                icon="📊"
                            />
                            <MetricCard
                                title="Avg Memory Score"
                                value={`${((metrics?.avgMemoryScore || 0) * 100).toFixed(1)}%`}
                                icon="🧠"
                            />
                            <MetricCard
                                title="Avg Reaction Time"
                                value={`${Math.round(metrics?.avgReactionTime || 0)}ms`}
                                icon="⚡"
                            />
                        </div>

                        <Card className="risk-card">
                            <CardHeader title="Risk Distribution" />
                            <CardContent>
                                <div className="risk-bars">
                                    <RiskBar label="Low Risk" count={metrics?.riskDistribution.low || 0} color="#10b981" />
                                    <RiskBar label="Medium Risk" count={metrics?.riskDistribution.medium || 0} color="#f59e0b" />
                                    <RiskBar label="High Risk" count={metrics?.riskDistribution.high || 0} color="#ef4444" />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
    return (
        <div className="metric-card">
            <span className="metric-icon">{icon}</span>
            <div className="metric-info">
                <span className="metric-value">{value}</span>
                <span className="metric-title">{title}</span>
            </div>
        </div>
    );
}

function RiskBar({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div className="risk-bar-item">
            <span className="risk-label">{label}</span>
            <div className="risk-bar-track">
                <div
                    className="risk-bar-fill"
                    style={{ width: `${Math.min(count * 10, 100)}%`, backgroundColor: color }}
                />
            </div>
            <span className="risk-count">{count}</span>
        </div>
    );
}
