import { useMemo } from 'react';
import { determineClinicalAlert, type PatientSessionContext } from '../../services/clinicalAlertService';
import type { TrajectoryClassification } from '../../services/statisticalDriftEngine';
import { Card, CardHeader, CardContent, Icon } from '../common';

interface ClinicalAlertCardProps {
    completedModulesCount: number;
    sessionHistoryCount: number;
    estimatedMoCA?: number;
    predictionProbabilities?: { normal: number; mci: number; dementia: number };
    trajectory?: TrajectoryClassification;
    onOpenClinicianReport?: () => void;
}

export function ClinicalAlertCard({
    completedModulesCount,
    sessionHistoryCount,
    estimatedMoCA,
    predictionProbabilities,
    trajectory,
    onOpenClinicianReport,
}: ClinicalAlertCardProps) {
    const context: PatientSessionContext = useMemo(
        () => ({
            completedModulesCount,
            sessionHistoryCount,
            estimatedMoCA,
            predictionProbabilities,
            trajectory,
        }),
        [completedModulesCount, sessionHistoryCount, estimatedMoCA, predictionProbabilities, trajectory]
    );

    const alertDecision = useMemo(() => determineClinicalAlert(context), [context]);

    const getBadgeStyle = (tier: string) => {
        switch (tier) {
            case 'STABLE':
                return {
                    bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
                    border: 'border-l-4 border-l-emerald-500',
                    glow: 'shadow-emerald-950/20',
                };
            case 'CONTINUE_MONITORING':
                return {
                    bg: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
                    border: 'border-l-4 border-l-yellow-500',
                    glow: 'shadow-yellow-950/20',
                };
            case 'RECOMMEND_EARLIER_REASSESSMENT':
                return {
                    bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
                    border: 'border-l-4 border-l-amber-500',
                    glow: 'shadow-amber-950/20',
                };
            case 'RECOMMEND_CLINICAL_EVALUATION':
                return {
                    bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
                    border: 'border-l-4 border-l-rose-500',
                    glow: 'shadow-rose-950/20',
                };
            default:
                return {
                    bg: 'bg-slate-500/15 border-slate-500/40 text-slate-300',
                    border: 'border-l-4 border-l-slate-500',
                    glow: '',
                };
        }
    };

    const style = getBadgeStyle(alertDecision.tier);

    return (
        <Card className={`clinical-alert-card shadow-lg ${style.border}`}>
            <CardHeader
                title="Clinical Decision Support & Alert Layer"
                subtitle="FDA SaMD Non-Diagnostic Enforcement Discretion Tier"
            />
            <CardContent>
                <div className="space-y-4">
                    {/* Top Tier Status Banner */}
                    <div className={`p-4 rounded-xl border ${style.bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{alertDecision.icon}</span>
                            <div>
                                <div className="text-xs uppercase tracking-wider font-bold opacity-80">
                                    Decision Support Status
                                </div>
                                <div className="text-lg font-extrabold text-white">
                                    {alertDecision.title}
                                </div>
                            </div>
                        </div>

                        {/* Multi-Factor Confidence Badge */}
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                            <Icon name="shield-check" size={16} className="text-cyan-400" />
                            <div className="text-right text-xs">
                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                    Confidence
                                </span>
                                <span className="font-mono font-bold text-cyan-300">
                                    {Math.round(alertDecision.confidence.compositeScore * 100)}% ({alertDecision.confidence.confidenceLevel})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recommendation Narrative */}
                    <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <Icon name="insight" size={14} className="text-cyan-400" />
                            Clinical Guidance & Next Steps:
                        </div>
                        <p className="text-slate-300 leading-relaxed pl-5">
                            {alertDecision.recommendation}
                        </p>
                    </div>

                    {/* 5-Factor Confidence Breakdown Bars */}
                    <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-300">
                                5-Factor Data Reliability Matrix
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                                5 Orthogonal Dimensions
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">Density</div>
                                <div className="font-mono font-bold text-slate-200">
                                    {Math.round(alertDecision.confidence.dimensions.density * 100)}%
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">Completeness</div>
                                <div className="font-mono font-bold text-slate-200">
                                    {Math.round(alertDecision.confidence.dimensions.completeness * 100)}%
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">OOD Normal</div>
                                <div className="font-mono font-bold text-slate-200">
                                    {Math.round(alertDecision.confidence.dimensions.oodDistance * 100)}%
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                <div className="text-slate-400 text-[10px]">Uncertainty</div>
                                <div className="font-mono font-bold text-slate-200">
                                    {Math.round(alertDecision.confidence.dimensions.uncertainty * 100)}%
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-2 rounded border border-slate-800 col-span-2 sm:col-span-1">
                                <div className="text-slate-400 text-[10px]">History Depth</div>
                                <div className="font-mono font-bold text-slate-200">
                                    {Math.round(alertDecision.confidence.dimensions.historyDepth * 100)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions & Clinician Report Trigger */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <span className="text-[10px] text-slate-500 italic max-w-sm">
                            Non-diagnostic screening tool. Does not substitute clinician assessment.
                        </span>
                        {onOpenClinicianReport && (
                            <button
                                type="button"
                                onClick={onOpenClinicianReport}
                                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
                            >
                                <Icon name="evidence" size={14} /> Generate Clinician Summary Report &rarr;
                            </button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
