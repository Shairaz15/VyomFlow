import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { ModuleTrendViewModel, ModuleSessionPoint } from '../../services/dashboardViewModel';

interface Props {
    trends: ModuleTrendViewModel[];
    onPointClick: (moduleKey: string, moduleName: string, session: ModuleSessionPoint) => void;
}

export function ModuleTrendCharts({ trends, onPointClick }: Props) {
    const nonEmpty = trends.filter(t => t.sessions.length > 0);
    if (nonEmpty.length === 0) return null;

    return (
        <div>
            <h3 className="dv2-section-title">Assessment Module Trends</h3>
            <div className="dv2-grid-2">
                {nonEmpty.map(trend => (
                    <div key={trend.moduleKey} className="dv2-card dv2-chart-card">
                        <div className="dv2-chart-title">
                            <span
                                className="dv2-chart-dot"
                                style={{ background: trend.chartColor }}
                            />
                            {trend.moduleName}
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={trend.sessions}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--dv2-card-border)"
                                />
                                <XAxis
                                    dataKey="sessionLabel"
                                    stroke="var(--dv2-muted)"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={trend.domain}
                                    stroke="var(--dv2-muted)"
                                    fontSize={11}
                                    tickLine={false}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--dv2-card-bg)',
                                        border: '1px solid var(--dv2-card-border)',
                                        borderRadius: '8px',
                                        color: 'var(--dv2-text)',
                                        fontSize: '0.8125rem',
                                    }}
                                    formatter={(value: any) => [
                                        `${value}${trend.unit}`,
                                        trend.moduleName,
                                    ]}
                                    labelFormatter={(label: any) => {
                                        const session = trend.sessions.find(
                                            s => s.sessionLabel === label
                                        );
                                        return session ? `${label} (${session.date})` : label;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke={trend.chartColor}
                                    strokeWidth={2}
                                    dot={{ fill: trend.chartColor, r: 4, cursor: 'pointer' }}
                                    activeDot={{
                                        r: 7,
                                        stroke: trend.chartColor,
                                        strokeWidth: 2,
                                        fill: 'var(--dv2-card-bg)',
                                        cursor: 'pointer',
                                        onClick: (_e: any, payload: any) => {
                                            if (payload?.payload) {
                                                onPointClick(
                                                    trend.moduleKey,
                                                    trend.moduleName,
                                                    payload.payload
                                                );
                                            }
                                        },
                                    }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ))}
            </div>
        </div>
    );
}
