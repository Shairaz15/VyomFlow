import { useMemo } from 'react';
import { JOURNEY_NODES, type JourneyNodeInfo, type ActivityId } from '../../hooks/useJourneyState';
import './MobileAdventureMap.css';

interface MobileAdventureMapProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
    activityLastCompletedMap?: Record<ActivityId, Date | null>;
    onNodeClick: (node: JourneyNodeInfo) => void;
}

// Geometric coordinates for each node on the 380 x 1560 SVG coordinate space
const MOBILE_NODE_LAYOUT: Record<ActivityId, {
    x: number;
    y: number;
    side: 'left' | 'right' | 'center';
    zoneName: string;
    zoneColor: string;
    decorIcon: string;
    accentTone: string;
}> = {
    story: {
        x: 95,
        y: 110,
        side: 'left',
        zoneName: 'Story Grove',
        zoneColor: 'rgba(79, 124, 120, 0.08)',
        decorIcon: '🍃',
        accentTone: '#4F7C78',
    },
    memory: {
        x: 285,
        y: 330,
        side: 'right',
        zoneName: 'Memory Garden',
        zoneColor: 'rgba(143, 175, 139, 0.08)',
        decorIcon: '🌸',
        accentTone: '#8FAF8B',
    },
    reaction: {
        x: 90,
        y: 560,
        side: 'left',
        zoneName: 'Firefly Trail',
        zoneColor: 'rgba(216, 184, 120, 0.08)',
        decorIcon: '✨',
        accentTone: '#D8B878',
    },
    pattern: {
        x: 290,
        y: 790,
        side: 'right',
        zoneName: 'Pattern Pond',
        zoneColor: 'rgba(74, 102, 128, 0.08)',
        decorIcon: '🪷',
        accentTone: '#4A6680',
    },
    attention: {
        x: 95,
        y: 1020,
        side: 'left',
        zoneName: 'Focus Meadow',
        zoneColor: 'rgba(79, 124, 120, 0.08)',
        decorIcon: '🌾',
        accentTone: '#4F7C78',
    },
    navigation: {
        x: 285,
        y: 1250,
        side: 'right',
        zoneName: 'Discovery Trail',
        zoneColor: 'rgba(74, 102, 128, 0.08)',
        decorIcon: '🧭',
        accentTone: '#4A6680',
    },
    language: {
        x: 190,
        y: 1460,
        side: 'center',
        zoneName: 'Story Corner',
        zoneColor: 'rgba(216, 184, 120, 0.08)',
        decorIcon: '📚',
        accentTone: '#D8B878',
    },
};

// Smooth organic winding cubic bezier path connecting all 7 destinations
const WINDING_PATH_D = 
    'M 95,110 ' +
    'C 95,230 285,210 285,330 ' +
    'C 285,460 90,430 90,560 ' +
    'C 90,690 290,660 290,790 ' +
    'C 290,920 95,890 95,1020 ' +
    'C 95,1150 285,1120 285,1250 ' +
    'C 285,1370 190,1370 190,1460';

export function MobileAdventureMap({
    completedActivityIds,
    activeNodeId,
    activityLastCompletedMap = {} as Record<ActivityId, Date | null>,
    onNodeClick,
}: MobileAdventureMapProps) {
    const completedCount = completedActivityIds.size;
    const totalCount = JOURNEY_NODES.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    const activeNode = useMemo(() => {
        return JOURNEY_NODES.find((n) => n.id === activeNodeId) || JOURNEY_NODES[0];
    }, [activeNodeId]);

    // Calculate days remaining for 7-day cooldown
    const getCooldownLabel = (id: ActivityId) => {
        const lastCompleted = activityLastCompletedMap[id];
        if (!lastCompleted) return null;
        try {
            const dateObj = lastCompleted instanceof Date ? lastCompleted : new Date(lastCompleted);
            const diffMs = Date.now() - dateObj.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(1, 7 - diffDays);
            return `Available in ${daysRemaining}d`;
        } catch {
            return null;
        }
    };

    return (
        <div className="mobile-adventure-world" role="region" aria-label="Mobile Cognitive Adventure Map">
            {/* Top Compact Adventure HUD Capsule */}
            <div className="adventure-hud-panel">
                <div className="adventure-hud-header">
                    <div className="adventure-hud-title-col">
                        <span className="adventure-hud-eyebrow">YOUR JOURNEY</span>
                        <span className="adventure-hud-count">
                            <strong>{completedCount}</strong> of {totalCount} Complete
                        </span>
                    </div>
                    {/* Progress Bar Capsule */}
                    <div className="adventure-progress-bar-wrap">
                        <div 
                            className="adventure-progress-bar-fill" 
                            style={{ width: `${progressPercent}%` }} 
                        />
                    </div>
                </div>

                {/* Active Next Activity Direct Callout */}
                {completedCount < totalCount && (
                    <div 
                        className="adventure-next-callout"
                        onClick={() => onNodeClick(activeNode)}
                    >
                        <span className="adventure-next-pulse" />
                        <span className="adventure-next-text">
                            Next: <strong>{activeNode.title}</strong> · {activeNode.duration}
                        </span>
                        <span className="adventure-next-arrow">→</span>
                    </div>
                )}
            </div>

            {/* Vertical Scrollable Illustrated Adventure Canvas */}
            <div className="adventure-canvas-stage">
                {/* 1. Subtle 2.5D Landscape Background Environment */}
                <div className="adventure-terrain-background" aria-hidden="true">
                    {/* Zone 1: Story Grove (Leaves & Warm Canopy) */}
                    <div className="adventure-zone-gradient zone-grove" style={{ top: '0px', height: '220px' }}>
                        <span className="terrain-item terrain-tree-left">🌳</span>
                        <span className="terrain-item terrain-leaf-right">🍃</span>
                    </div>

                    {/* Zone 2: Memory Garden (Blossoms & Lavender) */}
                    <div className="adventure-zone-gradient zone-garden" style={{ top: '220px', height: '230px' }}>
                        <span className="terrain-item terrain-flower-left">🌸</span>
                        <span className="terrain-item terrain-sprout-right">🌿</span>
                    </div>

                    {/* Zone 3: Firefly Trail (Evening Glow & Lanterns) */}
                    <div className="adventure-zone-gradient zone-firefly" style={{ top: '450px', height: '230px' }}>
                        <span className="terrain-item terrain-glow-left">✨</span>
                        <span className="terrain-item terrain-lantern-right">🌟</span>
                    </div>

                    {/* Zone 4: Pattern Pond (Ripples & Reeds) */}
                    <div className="adventure-zone-gradient zone-pond" style={{ top: '680px', height: '230px' }}>
                        <span className="terrain-item terrain-reed-left">🌾</span>
                        <span className="terrain-item terrain-ripple-right">🌊</span>
                    </div>

                    {/* Zone 5: Focus Meadow (Breezy Meadow Grass) */}
                    <div className="adventure-zone-gradient zone-meadow" style={{ top: '910px', height: '230px' }}>
                        <span className="terrain-item terrain-grass-left">🌱</span>
                        <span className="terrain-item terrain-cloud-right">☁️</span>
                    </div>

                    {/* Zone 6: Discovery Trail (Mountain Ridges & Compass) */}
                    <div className="adventure-zone-gradient zone-discovery" style={{ top: '1140px', height: '230px' }}>
                        <span className="terrain-item terrain-stone-left">🪨</span>
                        <span className="terrain-item terrain-compass-right">🧭</span>
                    </div>

                    {/* Zone 7: Story Corner (Cozy Library Books) */}
                    <div className="adventure-zone-gradient zone-corner" style={{ top: '1370px', height: '220px' }}>
                        <span className="terrain-item terrain-book-left">📚</span>
                        <span className="terrain-item terrain-candle-right">🕯️</span>
                    </div>
                </div>

                {/* 2. Organic Continuous Winding SVG Trail (Passes BEHIND Nodes) */}
                <svg 
                    className="adventure-winding-svg" 
                    viewBox="0 0 380 1560" 
                    preserveAspectRatio="none" 
                    aria-hidden="true"
                >
                    <defs>
                        {/* Soft Dimensional Gradient for Trail Highlight */}
                        <linearGradient id="adventureTrailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8FAF8B" />
                            <stop offset="35%" stopColor="#4F7C78" />
                            <stop offset="70%" stopColor="#D8B878" />
                            <stop offset="100%" stopColor="#8FAF8B" />
                        </linearGradient>
                        {/* Soft Glow Filter */}
                        <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Layer A: Outer Soft Shadow */}
                    <path
                        d={WINDING_PATH_D}
                        fill="none"
                        stroke="rgba(23, 50, 77, 0.1)"
                        strokeWidth="14"
                        strokeLinecap="round"
                    />

                    {/* Layer B: Physical Earthy Trail Base */}
                    <path
                        d={WINDING_PATH_D}
                        fill="none"
                        stroke="#D4C7A9"
                        strokeWidth="10"
                        strokeLinecap="round"
                        className="trail-base-path"
                    />

                    {/* Layer C: Active Inner Guided Trail */}
                    <path
                        d={WINDING_PATH_D}
                        fill="none"
                        stroke="url(#adventureTrailGradient)"
                        strokeWidth="4"
                        strokeDasharray="8 6"
                        strokeLinecap="round"
                        className="trail-pulse-path"
                    />
                </svg>

                {/* 3. 7 Tactile Level Nodes & Unobstructed Side Labels */}
                <div className="adventure-nodes-layer">
                    {JOURNEY_NODES.map((node) => {
                        const isCompleted = completedActivityIds.has(node.id);
                        const isActive = node.id === activeNodeId;
                        const isUpcoming = !isCompleted && !isActive;
                        const layout = MOBILE_NODE_LAYOUT[node.id];
                        const cooldownText = isCompleted ? getCooldownLabel(node.id) : null;

                        // Percent coordinates
                        const leftPercent = (layout.x / 380) * 100;
                        const topPercent = (layout.y / 1560) * 100;

                        return (
                            <div
                                key={node.id}
                                className={`adventure-node-wrapper side-${layout.side} ${isCompleted ? 'state-completed' : ''} ${isActive ? 'state-active' : ''} ${isUpcoming ? 'state-upcoming' : ''}`}
                                style={{
                                    left: `${leftPercent}%`,
                                    top: `${topPercent}%`,
                                }}
                            >
                                {/* Tactile Circular Level Node Button */}
                                <button
                                    type="button"
                                    onClick={() => onNodeClick(node)}
                                    className="adventure-node-btn"
                                    aria-label={`${node.title} (${node.canonicalTitle}) - Level ${node.order}. ${isCompleted ? 'Completed' : isActive ? 'Up Next' : 'Upcoming'}`}
                                >
                                    {/* Active Glowing Pulse Halo */}
                                    {isActive && <div className="adventure-node-halo" aria-hidden="true" />}

                                    {/* Attached Level Number Badge */}
                                    <div className="adventure-number-badge" aria-hidden="true">
                                        {node.order < 10 ? `0${node.order}` : node.order}
                                    </div>

                                    {/* Multi-Ring Tactile Disc */}
                                    <div 
                                        className="adventure-disc-outer"
                                        style={{ borderColor: layout.accentTone }}
                                    >
                                        <div className="adventure-disc-inner">
                                            <span className="adventure-node-icon" role="img" aria-hidden="true">
                                                {node.biome.icon}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Attached Status Badge (Bottom-Right) */}
                                    <div className="adventure-status-badge">
                                        {isCompleted ? (
                                            <span className="status-symbol done">✓</span>
                                        ) : isActive ? (
                                            <span className="status-symbol active">→</span>
                                        ) : (
                                            <span className="status-symbol locked">🔒</span>
                                        )}
                                    </div>
                                </button>

                                {/* Game Name Label Pill (Cleanly Positioned to the Side/Below, ZERO Overlap) */}
                                <div 
                                    className={`adventure-label-card label-pos-${layout.side}`}
                                    onClick={() => onNodeClick(node)}
                                >
                                    <div className="adventure-label-title-row">
                                        <h3 className="adventure-label-title">{node.title}</h3>
                                        {isActive && <span className="adventure-upnext-tag">UP NEXT</span>}
                                        {isCompleted && <span className="adventure-done-tag">DONE</span>}
                                    </div>
                                    <p className="adventure-label-domain">{node.canonicalTitle}</p>
                                    {cooldownText && (
                                        <div className="adventure-cooldown-text">{cooldownText}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
