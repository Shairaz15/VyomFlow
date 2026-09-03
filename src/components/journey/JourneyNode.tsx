import type { JourneyNodeInfo } from '../../hooks/useJourneyState';
import './JourneyNode.css';

interface JourneyNodeProps {
    node: JourneyNodeInfo;
    isCompleted: boolean;
    isActive: boolean;
    isUpcoming: boolean;
    onClick: (node: JourneyNodeInfo) => void;
}

export function JourneyNode({
    node,
    isCompleted,
    isActive,
    onClick,
}: JourneyNodeProps) {
    const getStatusLabel = () => {
        if (isCompleted) return 'Completed';
        if (isActive) return 'Up next';
        return 'Upcoming';
    };

    const getAriaLabel = () => {
        return `${node.title} (${node.canonicalTitle}) - Step ${node.order} of 7. Status: ${getStatusLabel()}. Click to view activity options.`;
    };

    return (
        <button
            type="button"
            className={`world-level-node ${isCompleted ? 'is-completed' : ''} ${isActive ? 'is-active' : ''} ${node.biome.themeClass}`}
            onClick={() => onClick(node)}
            aria-label={getAriaLabel()}
            aria-current={isActive ? 'step' : undefined}
        >
            {/* Background Halo Pulse for Active Node */}
            {isActive && <div className="level-halo-pulse" aria-hidden="true" />}

            {/* Step Number Badge */}
            <div className="level-step-badge" aria-hidden="true">
                {node.order}
            </div>

            {/* Main Embedded Level Circle Marker */}
            <div className="level-circle-marker" style={{ borderColor: node.biome.accentColor }}>
                <span className="level-emoji-icon" role="img" aria-hidden="true">
                    {node.biome.icon}
                </span>

                {/* Status Indicator Pill */}
                <div className="level-status-icon-badge">
                    {isCompleted ? (
                        <span className="status-symbol done">✓</span>
                    ) : isActive ? (
                        <span className="status-symbol active">→</span>
                    ) : (
                        <span className="status-symbol upcoming">○</span>
                    )}
                </div>
            </div>

            {/* Destination Name Pill Only (Clean Map, No SaaS Cards) */}
            <div className="level-title-pill">
                <span className="level-title-text">{node.title}</span>
                {isActive && <span className="level-upnext-indicator">Up next</span>}
                {isCompleted && <span className="level-completed-indicator">✓</span>}
            </div>
        </button>
    );
}
