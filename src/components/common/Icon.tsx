import React, { useState, useCallback } from "react";

export type IconName =
    | "brain-circuit"
    | "pulse"
    | "shield-check"
    | "chart-line-up"
    | "memory"
    | "reaction"
    | "pattern"
    | "language"
    | "assess"
    | "analyze"
    | "timeline"
    | "insight"
    | "privacy"
    | "evidence"
    | "notice"
    | "clock"
    | "check"
    | "chevron-right"
    | "trash"
    | "chart-trend"
    | "play"
    | "info"
    | "attention"
    | "story";

interface IconProps {
    name: IconName;
    size?: number;
    className?: string;
    animated?: boolean;
}

const iconPaths: Record<IconName, React.ReactNode> = {
    "brain-circuit": (
        <>
            <circle cx="12" cy="4" r="2" />
            <circle cx="4" cy="12" r="2" />
            <circle cx="20" cy="12" r="2" />
            <circle cx="12" cy="20" r="2" />
            <path d="M12 6v4m0 4v4" />
            <path d="M6 12h4m4 0h4" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    "pulse": (
        <>
            <path d="M3 12h4l3-9 4 18 3-9h4" className="icon-animated-path" />
        </>
    ),
    "shield-check": (
        <>
            <path d="M12 3l8 4v5c0 5.5-3.5 10-8 11.5C7.5 22 4 17.5 4 12V7l8-4z" />
            <path d="M9 12l2 2 4-4" />
        </>
    ),
    "chart-line-up": (
        <>
            <path d="M3 20h18" />
            <path d="M3 17l5-5 4 4 8-10" className="icon-animated-path" />
        </>
    ),
    "memory": (
        <>
            <rect x="4" y="6" width="6" height="6" rx="1" />
            <rect x="14" y="6" width="6" height="6" rx="1" />
            <rect x="9" y="12" width="6" height="6" rx="1" />
            <path d="M7 12v2" />
            <path d="M17 12v2" />
        </>
    ),
    "reaction": (
        <>
            <circle cx="12" cy="12" r="9" className="icon-animated-ring" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </>
    ),
    "pattern": (
        <>
            <circle cx="5" cy="5" r="2" />
            <circle cx="19" cy="5" r="2" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M6.5 6.5l4 4M17.5 6.5l-4 4M6.5 17.5l4-4M17.5 17.5l-4-4" />
        </>
    ),
    "language": (
        <>
            <path d="M3 12c2-2 4-3 6-3s4 1 6 3c2 2 4 3 6 3" className="icon-animated-wave" />
            <path d="M3 8c2-1.5 4-2 6-2s4 .5 6 2c2 1.5 4 2 6 2" opacity="0.5" />
            <path d="M3 16c2-1.5 4-2 6-2s4 .5 6 2c2 1.5 4 2 6 2" opacity="0.5" />
        </>
    ),
    "assess": (
        <>
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <path d="M8 15h4" />
            <circle cx="16" cy="15" r="2" />
        </>
    ),
    "analyze": (
        <>
            <path d="M3 20l4-4 3 3 5-7 6 8" className="icon-animated-path" />
            <circle cx="17" cy="6" r="3" />
        </>
    ),
    "timeline": (
        <>
            <path d="M12 3v18" />
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
            <path d="M14 6h4" />
            <path d="M6 12h4" />
            <path d="M14 18h4" />
        </>
    ),
    "insight": (
        <>
            <path d="M9 21h6" />
            <path d="M12 17v4" />
            <circle cx="12" cy="9" r="6" />
            <path d="M12 5v4M10 9h4" />
        </>
    ),
    "privacy": (
        <>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <circle cx="12" cy="16" r="1" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
    ),
    "evidence": (
        <>
            <path d="M9 3h6l2 4H7l2-4z" />
            <path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z" />
            <path d="M12 11v6" />
            <path d="M10 14h4" />
        </>
    ),
    "notice": (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
        </>
    ),
    "clock": (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l4 2" />
        </>
    ),
    "check": (
        <>
            <path d="M5 12l5 5L20 7" />
        </>
    ),
    "chevron-right": (
        <>
            <path d="M9 6l6 6-6 6" />
        </>
    ),
    "trash": (
        <>
            <path d="M4 6h16" />
            <path d="M10 6V4h4v2" />
            <path d="M6 6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
            <path d="M10 10v6M14 10v6" />
        </>
    ),
    "chart-trend": (
        <>
            <path d="M3 20h18" />
            <path d="M6 16l4-4 3 3 8-8" className="icon-animated-path" />
            <path d="M17 7h4v4" />
        </>
    ),
    "play": (
        <>
            <polygon points="6,4 20,12 6,20" />
        </>
    ),
    "info": (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <circle cx="12" cy="8" r="1" fill="currentColor" />
        </>
    ),
    "attention": (
        <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 5v-2M12 21v-2M5 12H3M21 12h-2" opacity="0.4" className="icon-animated-path" />
        </>
    ),
    "story": (
        <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8M8 11h6" strokeWidth="1.2" opacity="0.7" />
        </>
    ),
};

export function Icon({ name, size = 24, className = "", animated = false }: IconProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = useCallback(() => {
        if (animated) setIsHovered(true);
    }, [animated]);

    const handleMouseLeave = useCallback(() => {
        if (animated) setIsHovered(false);
    }, [animated]);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`icon icon-${name} ${animated ? 'icon-animated' : ''} ${isHovered ? 'icon-hovered' : ''} ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true"
        >
            {iconPaths[name]}
        </svg>
    );
}

/* Icon CSS - add to your styles */
export const iconStyles = `
.icon {
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.icon-animated:hover {
  transform: scale(1.1);
}

.icon-animated .icon-animated-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: none;
}

.icon-animated:hover .icon-animated-path {
  animation: iconDraw 1s ease-out forwards;
}

.icon-animated .icon-animated-ring {
  transform-origin: center;
  animation: none;
}

.icon-animated:hover .icon-animated-ring {
  animation: iconPulse 0.6s ease-in-out;
}

.icon-animated .icon-animated-wave {
  transform-origin: center;
}

.icon-animated:hover .icon-animated-wave {
  animation: iconWave 0.8s ease-in-out;
}

@keyframes iconDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.7;
  }
}

@keyframes iconWave {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-2px);
  }
  75% {
    transform: translateY(2px);
  }
}
`;
