/**
 * ==========================================================================
 * TutorialVideoPlaceholder.tsx (Upgraded to Multilingual TutorialVideoPlayer)
 * ==========================================================================
 * Seamlessly backwards-compatible: provides the live interactive video player
 * with 11 localized language tracks for any component that imports
 * TutorialVideoPlaceholder or TutorialVideoPlayer.
 */

import React from "react";
import { TutorialVideoPlayer } from "./TutorialVideoPlayer";
import type { AssessmentModuleType } from "./TutorialVideoPlayer";

export interface TutorialVideoPlaceholderProps {
    module?: AssessmentModuleType;
    title?: string;
    subtitle?: string;
    className?: string;
}

export const TutorialVideoPlaceholder: React.FC<TutorialVideoPlaceholderProps> = ({
    module,
    title,
    className = "",
}) => {
    return <TutorialVideoPlayer module={module} title={title} className={className} />;
};

export default TutorialVideoPlaceholder;
