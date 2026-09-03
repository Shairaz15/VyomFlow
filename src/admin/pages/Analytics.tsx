/**
 * Analytics Page
 * Aggregated charts for system-wide cognitive performance.
 */

import { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardHeader, CardContent } from '../../components/common';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import './Analytics.css';

interface AnalyticsData {
    sessionsPerWeek: { week: string; count: number }[];
    domainPerformance: { domain: string; score: number }[];
    riskDistribution: { name: string; value: number; color: string }[];
}

import { MOCK_ANALYTICS_DATA } from '../data/mockData';

export function Analytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use centralized mock data
        setData(MOCK_ANALYTICS_DATA);
        setLoading(false);
    }, []);

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <header className="admin-header">
                    <h1>Analytics</h1>
                </header>

                {loading ? (
                    <div className="admin-loading">Loading analytics...</div>
                ) : (
                    <div className="analytics-grid">
                        <Card className="chart-card sessions-chart">
                            <CardHeader title="Sessions Per Week" />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={data?.sessionsPerWeek}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="week" stroke="#888" fontSize={12} />
                                        <YAxis stroke="#888" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            dot={{ fill: '#8b5cf6', r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="chart-card domain-chart">
                            <CardHeader title="Domain Performance" />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={data?.domainPerformance} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis type="number" domain={[0, 100]} stroke="#888" fontSize={12} />
                                        <YAxis type="category" dataKey="domain" stroke="#888" fontSize={12} width={80} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                        />
                                        <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="chart-card risk-chart">
                            <CardHeader title="Risk Distribution" />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={data?.riskDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {data?.riskDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a2e',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="risk-legend">
                                    {data?.riskDistribution.map((item) => (
                                        <div key={item.name} className="legend-item">
                                            <span className="legend-color" style={{ background: item.color }} />
                                            <span>{item.name}: {item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
