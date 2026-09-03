import { useState } from 'react';
import { JOURNEY_NODES, type JourneyNodeInfo, type ActivityId } from '../../hooks/useJourneyState';
import { JourneyNode } from './JourneyNode';
import { ActivityIntroModal } from './ActivityIntroModal';
import './JourneyMap.css';

interface JourneyMapProps {
    completedActivityIds: Set<ActivityId>;
    activeNodeId: ActivityId;
}

// 2D World Landscape Positions (% left, pixel top) for Desktop Canvas
const WORLD_NODE_POSITIONS: Record<string, { left: string; top: string }> = {
    story: { left: '20%', top: '60px' },
    memory: { left: '68%', top: '230px' },
    reaction: { left: '28%', top: '410px' },
    pattern: { left: '72%', top: '590px' },
    attention: { left: '22%', top: '770px' },
    navigation: { left: '68%', top: '950px' },
    language: { left: '46%', top: '1110px' },
};

export function JourneyMap({ completedActivityIds, activeNodeId }: JourneyMapProps) {
    const [selectedNode, setSelectedNode] = useState<JourneyNodeInfo | null>(null);

    const handleNodeClick = (node: JourneyNodeInfo) => {
        setSelectedNode(node);
    };

    const handleCloseModal = () => {
        setSelectedNode(null);
    };

    return (
        <div className="world-journey-wrapper" role="region" aria-label="VyomFlow World Journey Map">
            {/* Expansive Vertically-Scrollable 2D World Canvas */}
            <div className="world-map-canvas">
                {/* Environmental Scenery Background Biomes */}
                <div className="world-environmental-terrain">
                    {/* Story Grove Biome */}
                    <div className="biome-zone zone-story-grove" style={{ top: '0px', height: '240px' }}>
                        <div className="biome-watermark-tag">🌳 Story Grove</div>
                        <span className="env-scenery tree-1">🌲</span>
                        <span className="env-scenery tree-2">🌳</span>
                        <span className="env-scenery leaf-1">🍃</span>
                    </div>

                    {/* Memory Garden Biome */}
                    <div className="biome-zone zone-memory-garden" style={{ top: '240px', height: '230px' }}>
                        <div className="biome-watermark-tag">🌿 Memory Garden</div>
                        <span className="env-scenery flower-1">🌸</span>
                        <span className="env-scenery plant-1">🪴</span>
                        <span className="env-scenery stone-1">🪨</span>
                    </div>

                    {/* Firefly Trail Biome */}
                    <div className="biome-zone zone-firefly-trail" style={{ top: '470px', height: '230px' }}>
                        <div className="biome-watermark-tag">✨ Firefly Trail</div>
                        <span className="env-scenery glow-1">✨</span>
                        <span className="env-scenery glow-2">🌟</span>
                        <span className="env-scenery night-tree">🌲</span>
                    </div>

                    {/* Pattern Pond Biome */}
                    <div className="biome-zone zone-pattern-pond" style={{ top: '700px', height: '230px' }}>
                        <div className="biome-watermark-tag">🌊 Pattern Pond</div>
                        <span className="env-scenery ripple-1">🌊</span>
                        <span className="env-scenery lily-1">🪷</span>
                        <span className="env-scenery reed-1">🌾</span>
                    </div>

                    {/* Focus Meadow Biome */}
                    <div className="biome-zone zone-focus-meadow" style={{ top: '930px', height: '220px' }}>
                        <div className="biome-watermark-tag">🎯 Focus Meadow</div>
                        <span className="env-scenery grass-1">🌱</span>
                        <span className="env-scenery target-cloud">☁️</span>
                    </div>

                    {/* Discovery Trail Biome */}
                    <div className="biome-zone zone-discovery-trail" style={{ top: '1150px', height: '220px' }}>
                        <div className="biome-watermark-tag">🧭 Discovery Trail</div>
                        <span className="env-scenery rock-1">🪨</span>
                        <span className="env-scenery compass-sign">🧭</span>
                    </div>

                    {/* Story Corner Biome */}
                    <div className="biome-zone zone-story-corner" style={{ top: '1370px', height: '230px' }}>
                        <div className="biome-watermark-tag">🗣️ Story Corner</div>
                        <span className="env-scenery book-1">📚</span>
                        <span className="env-scenery lamp-1">🕯️</span>
                    </div>
                </div>

                {/* Continuous Winding SVG Trail Path */}
                <svg className="world-svg-trail desktop-world-trail" viewBox="0 0 1000 1260" preserveAspectRatio="none" aria-hidden="true">
                    {/* Shadow Trail */}
                    <path
                        d="M 200,90 C 450,90 680,120 680,260 C 680,360 280,330 280,440 C 280,540 720,500 720,620 C 720,720 220,700 220,800 C 220,900 680,870 680,980 C 680,1070 460,1050 460,1140"
                        fill="none"
                        stroke="rgba(24, 59, 86, 0.12)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    {/* Background Base Path */}
                    <path
                        d="M 200,90 C 450,90 680,120 680,260 C 680,360 280,330 280,440 C 280,540 720,500 720,620 C 720,720 220,700 220,800 C 220,900 680,870 680,980 C 680,1070 460,1050 460,1140"
                        fill="none"
                        stroke="var(--glass-border)"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    {/* Active Dashed Animated Trail */}
                    <path
                        d="M 200,90 C 450,90 680,120 680,260 C 680,360 280,330 280,440 C 280,540 720,500 720,620 C 720,720 220,700 220,800 C 220,900 680,870 680,980 C 680,1070 460,1050 460,1140"
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="5"
                        strokeDasharray="10 8"
                        strokeLinecap="round"
                        className="path-active-trail"
                    />
                </svg>

                {/* 7 Level Marker Destinations Embedded Along Path */}
                <nav className="world-nodes-container" aria-label="Journey Activity Destinations">
                    {JOURNEY_NODES.map((node) => {
                        const isCompleted = completedActivityIds.has(node.id);
                        const isActive = node.id === activeNodeId;
                        const isUpcoming = !isCompleted && !isActive;
                        const pos = WORLD_NODE_POSITIONS[node.id] || { left: '50%', top: '100px' };

                        return (
                            <div
                                key={node.id}
                                className={`world-node-position node-pos-${node.id}`}
                                style={{ left: pos.left, top: pos.top }}
                            >
                                <JourneyNode
                                    node={node}
                                    isCompleted={isCompleted}
                                    isActive={isActive}
                                    isUpcoming={isUpcoming}
                                    onClick={handleNodeClick}
                                />
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Activity Introduction / Preview Modal */}
            {selectedNode && (
                <ActivityIntroModal
                    node={selectedNode}
                    isCompleted={completedActivityIds.has(selectedNode.id)}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}
