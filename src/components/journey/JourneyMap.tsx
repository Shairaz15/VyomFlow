import { type ActivityId, type ActivityScoreInfo } from '../../hooks/useJourneyState';
import { SynapseBeamTrail } from './prototypes/SynapseBeamTrail';
import './JourneyMap.css';

interface JourneyMapProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
    activityLastCompletedMap?: Record<ActivityId, Date | null>;
    activityLatestScoreMap?: Record<ActivityId, ActivityScoreInfo | null>;
    filterMode?: 'all' | 'remaining' | 'completed';
}

export function JourneyMap({ 
    completedActivityIds, 
    activeNodeId,
    activityLastCompletedMap = {} as Record<ActivityId, Date | null>,
    activityLatestScoreMap = {} as Record<ActivityId, ActivityScoreInfo | null>,
    filterMode = 'all'
}: JourneyMapProps) {
    return (
        <div className="world-journey-wrapper" role="region" aria-label="VyomFlow Test Journey Trail">
            <SynapseBeamTrail
                completedActivityIds={completedActivityIds}
                activeNodeId={activeNodeId}
                activityLastCompletedMap={activityLastCompletedMap}
                activityLatestScoreMap={activityLatestScoreMap}
                filterMode={filterMode}
            />
        </div>
    );
}
