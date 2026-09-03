import { Button, Card, Icon } from "../../../common";

interface InstructionsPhaseProps {
    onStart: () => void;
}

export function InstructionsPhase({ onStart }: InstructionsPhaseProps) {
    const steps = [
        {
            num: "01",
            icon: "navigation" as const,
            title: "Watch the Route (A → H)",
            description: "Watch a first-person walking video from Start (A) to Destination (H). Observe the turns, path, and landmarks along the route.",
            badge: "Phase 1",
        },
        {
            num: "02",
            icon: "shield-check" as const,
            title: "Destination Recall",
            description: "Confirm your final destination with a quick multiple-choice recall question.",
            badge: "Phase 2",
        },
        {
            num: "03",
            icon: "reaction" as const,
            title: "Navigate in Reverse (H → A)",
            description: "Watch short clips retracing the route backwards. At each intersection, choose whether to turn Left, Right, go Straight, or Back.",
            badge: "Phase 3",
        },
        {
            num: "04",
            icon: "memory" as const,
            title: "Landmark Chronology",
            description: "Identify the 5 real landmarks you saw along the route and arrange them in the exact order they appeared from A to H.",
            badge: "Phase 4",
        },
    ];

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 animate-fadeInUp">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon name="navigation" size={16} />
                    <span>Visuospatial Biomarker Protocol</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Immersive Navigation Assessment
                </h1>
                <p className="text-base text-slate-400 max-w-xl mx-auto">
                    Real-World First-Person Route Learning, Spatial Orientation & Landmark Memory
                </p>
                <div className="inline-flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                        <Icon name="clock" size={14} className="text-cyan-400" />
                        Duration: ~5 min
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>8 Route Waypoints (A–H)</span>
                    <span className="text-slate-600">•</span>
                    <span>17+ Digital Biomarkers</span>
                </div>
            </div>

            {/* Step Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steps.map((step) => (
                    <Card
                        key={step.num}
                        className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-cyan-500/40 transition-all space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-mono font-bold text-cyan-400/50">
                                {step.num}
                            </span>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {step.badge}
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Icon name={step.icon} size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-white">
                                    {step.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Important Guidelines Notice */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 flex items-start gap-3">
                <Icon name="info" size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <strong className="text-cyan-300 font-semibold block">Instructions & Tips</strong>
                    <p className="text-slate-400 leading-relaxed">
                        Pay close attention during the initial encoding video — the video plays once without pausing. You will be tested on your ability to retrace the steps in reverse and identify key buildings and visual landmarks.
                    </p>
                </div>
            </div>

            {/* CTA Button */}
            <div className="text-center pt-2">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={onStart}
                    className="min-w-[240px] shadow-xl shadow-cyan-500/20 text-base font-semibold"
                >
                    Begin Assessment →
                </Button>
            </div>
        </div>
    );
}
