import { type ActivityId } from '../../hooks/useJourneyState';
import { SynapseBeamTrail } from './prototypes/SynapseBeamTrail';
import './JourneyMap.css';

interface JourneyMapProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
    activityLastCompletedMap?: Record<ActivityId, Date | null>;
}

export function JourneyMap({ 
    completedActivityIds, 
    activeNodeId,
    activityLastCompletedMap = {} as Record<ActivityId, Date | null>
}: JourneyMapProps) {
    return (
        <div className="world-journey-wrapper" role="region" aria-label="VyomFlow Test Journey Trail">
            <SynapseBeamTrail
                completedActivityIds={completedActivityIds}
                activeNodeId={activeNodeId}
                activityLastCompletedMap={activityLastCompletedMap}
            />
        </div>
    );
}
