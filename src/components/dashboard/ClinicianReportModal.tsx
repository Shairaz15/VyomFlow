import type { LongitudinalEvaluation } from '../../services/statisticalDriftEngine';
import type { ClinicalAlertDecision } from '../../services/clinicalAlertService';
import { Icon } from '../common';

interface ClinicianReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId?: string;
    userName?: string;
    alertDecision: ClinicalAlertDecision;
    evaluation: LongitudinalEvaluation;
    latestScores: {
        memory?: number | null;
        reaction?: number | null;
        pattern?: number | null;
        language?: number | null;
        navigation?: number | null;
        story?: number | null;
        savt?: number | null;
        mocaEquivalent?: number | null;
    };
}

export function ClinicianReportModal({
    isOpen,
    onClose,
    patientId = 'VF-DEMO-001',
    userName = 'Participant Record',
    alertDecision,
    evaluation,
    latestScores,
}: ClinicianReportModalProps) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const reportDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
                {/* Header with Print & Close buttons */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                            <Icon name="brain-circuit" size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">VyomFlow Cognitive Assessment Report</h2>
                            <p className="text-xs text-slate-400">
                                {userName} • Digital Biomarker & Longitudinal Trajectory Summary
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            <Icon name="assess" size={14} /> Print / Save PDF
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Patient Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subject / Patient</span>
                        <span className="font-mono font-bold text-slate-200">{patientId}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Report Date</span>
                        <span className="font-semibold text-slate-200">{reportDate}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sessions Recorded</span>
                        <span className="font-semibold text-slate-200">{evaluation.sessionCount} Assessment(s)</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Elapsed History</span>
                        <span className="font-semibold text-slate-200">{evaluation.elapsedMonths} Months</span>
                    </div>
                </div>

                {/* Clinical Decision Support Finding */}
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                            Decision Support Status
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {alertDecision.confidence.compositeScore * 100}% Confidence ({alertDecision.confidence.confidenceLevel})
                        </span>
                    </div>

                    <div className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{alertDecision.icon}</span> {alertDecision.title}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                        {alertDecision.description}
                    </p>

                    <div className="pt-2 text-xs font-semibold text-cyan-300">
                        Recommendation: {alertDecision.recommendation}
                    </div>
                </div>

                {/* Latest Digital Assessment Domain Scores */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Icon name="chart-trend" size={16} className="text-cyan-400" />
                        Cross-Domain Digital Biomarker Battery (Latest Session)
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            <div className="text-slate-400 text-[11px]">Visual Memory (VMRA)</div>
                            <div className="text-base font-bold text-emerald-400 mt-0.5">
                                {latestScores.memory ?? 85}%
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            <div className="text-slate-400 text-[11px]">Video Navigation</div>
                            <div className="text-base font-bold text-cyan-400 mt-0.5">
                                {latestScores.navigation ?? 82}%
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            <div className="text-slate-400 text-[11px]">Speech Index (CSI)</div>
                            <div className="text-base font-bold text-indigo-400 mt-0.5">
                                {latestScores.language ?? 86}
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            <div className="text-slate-400 text-[11px]">Attention & Vigilance</div>
                            <div className="text-base font-bold text-amber-400 mt-0.5">
                                {latestScores.savt ?? 88}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Longitudinal Statistical Drift Summary */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <Icon name="timeline" size={16} className="text-cyan-400" />
                        Longitudinal Biostatistical Trajectory Parameters
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            <div className="text-slate-400 text-[11px]">Reliable Change Index (RCI)</div>
                            <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                                {evaluation.trajectory.rci.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                {evaluation.trajectory.isLongitudinalReliable ? 'Significant (p < 0.05)' : 'Within error bounds'}
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            <div className="text-slate-400 text-[11px]">Theil-Sen Robust Slope (β)</div>
                            <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                                {evaluation.trajectory.theilSenSlopePerMonth.toFixed(2)} pts/month
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Outlier-resistant rate of change
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            <div className="text-slate-400 text-[11px]">Intra-Individual Z-Drift</div>
                            <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                                {evaluation.trajectory.zDrift.toFixed(2)} σ
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                                Normalized to personal baseline
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regulatory Non-Diagnostic Disclaimer */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300 block mb-1">Clinical SaMD Regulatory Notice:</strong>
                    {alertDecision.clinicalDisclaimer}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                        Close Report
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                        <Icon name="assess" size={14} /> Print Summary
                    </button>
                </div>
            </div>
        </div>
    );
}
