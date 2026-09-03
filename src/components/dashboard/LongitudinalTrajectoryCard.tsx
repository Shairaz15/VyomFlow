import { useMemo } from 'react';
import {
    evaluatePatientTrajectory,
    type LongitudinalSessionPoint,
    type LongitudinalEvaluation,
    type TrajectoryTier
} from '../../services/statisticalDriftEngine';
import { Card, CardHeader, CardContent, Icon } from '../common';

interface LongitudinalTrajectoryCardProps {
    sessionPoints: LongitudinalSessionPoint[];
}

export function LongitudinalTrajectoryCard({ sessionPoints }: LongitudinalTrajectoryCardProps) {
    const evaluation: LongitudinalEvaluation = useMemo(() => {
        return evaluatePatientTrajectory(sessionPoints);
    }, [sessionPoints]);

    const { trajectory, sessionCount, elapsedMonths, domainDrifts } = evaluation;

    const getTierBadge = (tier: TrajectoryTier) => {
        switch (tier) {
            case 'Stable':
                return {
                    color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
                    icon: '🟢',
                    label: 'Stable Trajectory',
                };
            case 'Possible Decline':
                return {
                    color: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30',
                    icon: '🟡',
                    label: 'Possible Minor Decline',
                };
            case 'Likely Decline':
                return {
                    color: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
                    icon: '🟠',
                    label: 'Likely Reliable Decline',
                };
            case 'Rapid Decline':
                return {
                    color: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
                    icon: '🔴',
                    label: 'Rapid Multi-Domain Decline',
                };
            case 'Improving':
                return {
                    color: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
                    icon: '🔵',
                    label: 'Improving Performance',
                };
            default:
                return {
                    color: 'text-slate-300 bg-slate-500/15 border-slate-500/30',
                    icon: '⚪',
                    label: 'Insufficient Baseline',
                };
        }
    };

    const tierBadge = getTierBadge(trajectory.tier);

    return (
        <Card className="longitudinal-trajectory-card">
            <CardHeader
                title="Statistical Longitudinal Drift Engine"
                subtitle={`Intra-Individual Biostatistical Tracking (${sessionCount} Sessions across ${elapsedMonths} Months)`}
            />
            <CardContent>
                <div className="space-y-4">
                    {/* Trajectory Status Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2.5">
                            <span className="text-xl">{tierBadge.icon}</span>
                            <div>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${tierBadge.color}`}>
                                    {tierBadge.label}
                                </span>
                                <p className="text-xs text-slate-300 mt-1">
                                    {trajectory.clinicalInterpretation}
                                </p>
                            </div>
                        </div>

                        <div className="text-left sm:text-right text-xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                Theil-Sen Robust Slope (β)
                            </span>
                            <span
                                className={`font-mono font-bold text-sm ${
                                    trajectory.theilSenSlopePerMonth < -0.15
                                        ? 'text-rose-400'
                                        : trajectory.theilSenSlopePerMonth < -0.05
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                }`}
                            >
                                {trajectory.theilSenSlopePerMonth > 0 ? '+' : ''}
                                {trajectory.theilSenSlopePerMonth.toFixed(2)} pts/month
                            </span>
                        </div>
                    </div>

                    {/* Biostatistical Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                Reliable Change Index (RCI)
                            </div>
                            <div className="text-base font-extrabold font-mono text-slate-100 mt-0.5">
                                {trajectory.rci > 0 ? '+' : ''}
                                {trajectory.rci.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                {trajectory.isLongitudinalReliable ? 'Significant (|RCI| ≥ 1.96)' : 'Within error bounds'}
                            </div>
                        </div>

                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                Personal Z-Drift (Z_drift)
                            </div>
                            <div className="text-base font-extrabold font-mono text-cyan-400 mt-0.5">
                                {trajectory.zDrift > 0 ? '+' : ''}
                                {trajectory.zDrift.toFixed(2)} σ
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Relative to own baseline
                            </div>
                        </div>

                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                Score Variance (CV)
                            </div>
                            <div className="text-base font-extrabold font-mono text-slate-100 mt-0.5">
                                {trajectory.coefficientOfVariationPercent.toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Intra-individual variance
                            </div>
                        </div>

                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                Longitudinal Depth
                            </div>
                            <div className="text-base font-extrabold font-mono text-slate-100 mt-0.5">
                                {sessionCount} Visits
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                {elapsedMonths.toFixed(1)} months tracked
                            </div>
                        </div>
                    </div>

                    {/* Sub-Domain Trajectory Drifts */}
                    {Object.keys(domainDrifts).length > 0 && (
                        <div className="pt-2 border-t border-slate-800">
                            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                                <Icon name="timeline" size={14} className="text-cyan-400" />
                                Sub-Domain Longitudinal Stability
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.entries(domainDrifts).map(([domain, data]) => (
                                    <div
                                        key={domain}
                                        className="p-2.5 bg-slate-900/30 rounded border border-slate-800/60 text-xs flex flex-col justify-between"
                                    >
                                        <div className="font-semibold text-slate-300 capitalize">{domain}</div>
                                        <div className="flex items-center justify-between mt-1 text-[11px]">
                                            <span className="text-slate-400">RCI:</span>
                                            <span
                                                className={`font-mono font-bold ${
                                                    data.rci <= -1.96
                                                        ? 'text-rose-400'
                                                        : data.rci <= -1.0
                                                        ? 'text-amber-400'
                                                        : 'text-emerald-400'
                                                }`}
                                            >
                                                {data.rci > 0 ? '+' : ''}
                                                {data.rci.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
