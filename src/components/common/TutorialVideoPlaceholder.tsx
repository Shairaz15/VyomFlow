import "./TutorialVideoPlaceholder.css";

interface TutorialVideoPlaceholderProps {
    title?: string;
    subtitle?: string;
    className?: string;
}

export function TutorialVideoPlaceholder({
    title = "Tutorial Video",
    subtitle = "Video coming soon",
    className = "",
}: TutorialVideoPlaceholderProps) {
    return (
        <div className={`tutorial-video-container ${className}`}>
            <div className="tutorial-video-card">
                <div className="tutorial-video-placeholder">
                    <div className="tutorial-play-icon-wrap" aria-hidden="true">
                        <span className="tutorial-play-icon">▶</span>
                    </div>
                    <div className="tutorial-meta">
                        <span className="tutorial-title">{title}</span>
                        <span className="tutorial-subtitle">{subtitle}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
