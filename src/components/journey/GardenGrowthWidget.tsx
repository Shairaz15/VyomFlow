import './GardenGrowthWidget.css';

interface GardenGrowthWidgetProps {
    totalSessions: number;
    growthLevel: {
        stage: string;
        icon: string;
        label: string;
        nextThreshold: number;
    };
}

export function GardenGrowthWidget({ totalSessions, growthLevel }: GardenGrowthWidgetProps) {
    const stages = [
        { icon: '🌱', label: 'Seed', min: 1 },
        { icon: '🌿', label: 'Sprout', min: 3 },
        { icon: '🌸', label: 'Flower', min: 7 },
        { icon: '🌳', label: 'Small Tree', min: 14 },
        { icon: '🏡', label: 'Flourishing Garden', min: 30 },
    ];

    return (
        <div className="growth-widget-card">
            <div className="growth-widget-header">
                <div className="growth-widget-title-group">
                    <span className="growth-hero-icon" role="img" aria-label={growthLevel.stage}>
                        {growthLevel.icon}
                    </span>
                    <div>
                        <h3 className="growth-stage-title">{growthLevel.stage}</h3>
                        <p className="growth-stage-subtitle">{growthLevel.label}</p>
                    </div>
                </div>
                <div className="growth-counter-badge">
                    <strong>{totalSessions}</strong> check-in{totalSessions === 1 ? '' : 's'}
                </div>
            </div>

            {/* Stage Progress Milestones */}
            <div className="growth-milestones">
                {stages.map((st) => {
                    const isUnlocked = totalSessions >= st.min;
                    return (
                        <div
                            key={st.label}
                            className={`milestone-item ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
                            title={`${st.label} (${st.min} check-in${st.min === 1 ? '' : 's'})`}
                        >
                            <span className="milestone-icon">{st.icon}</span>
                            <span className="milestone-label">{st.label}</span>
                            <span className="milestone-min">{st.min}d</span>
                        </div>
                    );
                })}
            </div>

            <p className="growth-note">
                🌿 Consistency reward: Your environment grows as you complete check-ins over time.
            </p>
        </div>
    );
}
