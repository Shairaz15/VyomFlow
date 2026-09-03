import { CognitiveRadarChart, type CognitiveRadarDomainScores } from './CognitiveRadarChart';

interface Props {
    scores: CognitiveRadarDomainScores;
}

export function CognitiveRadarSection({ scores }: Props) {
    const hasScores = Object.values(scores).some(v => v > 0);
    if (!hasScores) return null;

    return (
        <div className="dv2-card dv2-animate-in" style={{ textAlign: 'center' }}>
            <h3 className="dv2-section-title" style={{ textAlign: 'left' }}>
                6-Domain Cognitive Envelope
            </h3>
            <CognitiveRadarChart scores={scores} size={300} showNormative={true} />
        </div>
    );
}
