export type CognitiveDomain =
    | "story"
    | "vmra"
    | "reaction"
    | "pattern"
    | "attention"
    | "navigation"
    | "language";

interface CognitiveDomainIconProps {
    domain: CognitiveDomain;
    size?: number;
    className?: string;
}

export function CognitiveDomainIcon({
    domain,
    size = 36,
    className = "",
}: CognitiveDomainIconProps) {
    switch (domain) {
        case "story":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`vyom-domain-svg vyom-svg-story ${className}`}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="storyBookGrad" x1="6" y1="10" x2="30" y2="25" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#4F7C78" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#8FAF8B" stopOpacity="0.28" />
                        </linearGradient>
                        <linearGradient id="storySparkGrad" x1="12" y1="5" x2="24" y2="9" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#D8B878" />
                            <stop offset="100%" stopColor="#FCD34D" />
                        </linearGradient>
                    </defs>
                    {/* Open Book Base with Layered Pages */}
                    <path
                        d="M6.5 24.2C10.2 22.3 14.8 22.8 18 24.8C21.2 22.8 25.8 22.3 29.5 24.2V11.2C25.8 9.3 21.2 9.8 18 11.8C14.8 9.8 10.2 9.3 6.5 11.2V24.2Z"
                        fill="url(#storyBookGrad)"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    {/* Center Spine */}
                    <path d="M18 11.8V24.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    {/* Subtle Page Content Lines */}
                    <path d="M10 15C12.5 14.3 15 14.7 16 15.5M10 18.5C12.5 17.8 15 18.2 16 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
                    <path d="M26 15C23.5 14.3 21 14.7 20 15.5M26 18.5C23.5 17.8 21 18.2 20 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
                    {/* Ascending Synaptic Memory Spark Array */}
                    <path d="M12 7.5L18 5.5L24 7.5" stroke="#D8B878" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.85" />
                    <path d="M18 5.5V9.5" stroke="#D8B878" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
                    <circle cx="18" cy="5.5" r="2" fill="url(#storySparkGrad)" stroke="#17324D" strokeWidth="0.8" />
                    <circle cx="12" cy="7.5" r="1.4" fill="#8FAF8B" stroke="currentColor" strokeWidth="0.7" />
                    <circle cx="24" cy="7.5" r="1.4" fill="#8FAF8B" stroke="currentColor" strokeWidth="0.7" />
                </svg>
            );

        case "vmra":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`vyom-domain-svg vyom-svg-vmra ${className}`}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="vmraFrameGrad" x1="7" y1="8" x2="29" y2="28" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#4F7C78" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#17324D" stopOpacity="0.22" />
                        </linearGradient>
                        <linearGradient id="vmraEyeGrad" x1="15" y1="15" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#5EEAD4" />
                            <stop offset="100%" stopColor="#2DD4BF" />
                        </linearGradient>
                    </defs>
                    {/* Dimensional Visual Scene Card */}
                    <rect
                        x="6.5"
                        y="8.5"
                        width="23"
                        height="19"
                        rx="3.5"
                        fill="url(#vmraFrameGrad)"
                        stroke="currentColor"
                        strokeWidth="1.6"
                    />
                    {/* Top Optical Viewfinder Tab */}
                    <path
                        d="M13.5 8.5V7C13.5 6.2 14.2 5.5 15 5.5H21C21.8 5.5 22.5 6.2 22.5 7V8.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                    />
                    {/* Optical Recognition Eye Shape */}
                    <path
                        d="M10.5 18C12.8 14.8 15.4 13.2 18 13.2C20.6 13.2 23.2 14.8 25.5 18C23.2 21.2 20.6 22.8 18 22.8C15.4 22.8 12.8 21.2 10.5 18Z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        fill="none"
                    />
                    {/* Neural Pupil with Reflective Spark */}
                    <circle cx="18" cy="18" r="3" fill="url(#vmraEyeGrad)" stroke="#17324D" strokeWidth="0.9" />
                    <circle cx="19" cy="17" r="0.8" fill="#FFFFFF" />
                    {/* Recognition Indicator Spark */}
                    <circle cx="25.5" cy="12" r="1.3" fill="#5EEAD4" stroke="currentColor" strokeWidth="0.6" />
                    <path d="M23 13.5L25.5 12" stroke="#5EEAD4" strokeWidth="1" strokeLinecap="round" />
                </svg>
            );

        case "reaction":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`vyom-domain-svg vyom-svg-reaction ${className}`}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="reactionBoltGrad" x1="14" y1="8" x2="24" y2="28" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#FCD34D" />
                            <stop offset="50%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                    </defs>
                    {/* Chronometer Timing Ring */}
                    <circle
                        cx="18"
                        cy="18.5"
                        r="11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="3.5 2.5"
                        fill="none"
                        opacity="0.6"
                    />
                    {/* Top Chrono Pusher */}
                    <path d="M18 4.5V7.5M15 4.5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    {/* Lateral Millisecond Response Ticks */}
                    <path d="M6 18.5H8M28 18.5H30M18 27.5V29.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
                    {/* Dynamic Neural Lightning Bolt */}
                    <path
                        d="M20 7.5L13 18H18.5L16 28.5L24 16.5H18.5L21 7.5H20Z"
                        fill="url(#reactionBoltGrad)"
                        stroke="#17324D"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                    />
                    {/* Latency Wave Arcs */}
                    <path d="M7.5 13C6.8 14.6 6.5 16.5 6.5 18.5M7.5 24C8.5 25.8 10 27.2 11.8 28.2" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
                </svg>
            );

        case "pattern":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`vyom-domain-svg vyom-svg-pattern ${className}`}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="patternPolyGrad" x1="9" y1="7" x2="27" y2="26" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#4F7C78" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.18" />
                        </linearGradient>
                        <linearGradient id="patternNexusGrad" x1="15" y1="15" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#5EEAD4" />
                            <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                    </defs>
                    {/* Interconnected Constellation Matrix */}
                    <polygon
                        points="18,6.5 27.5,13.5 23.5,26.5 12.5,26.5 8.5,13.5"
                        fill="url(#patternPolyGrad)"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeDasharray="2 1.5"
                        opacity="0.8"
                    />
                    {/* Radial Connecting Synapses to Center */}
                    <line x1="18" y1="6.5" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
                    <line x1="27.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
                    <line x1="23.5" y1="26.5" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
                    <line x1="12.5" y1="26.5" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
                    <line x1="8.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
                    {/* Peripheral Nodes */}
                    <circle cx="18" cy="6.5" r="1.8" fill="#8FAF8B" stroke="currentColor" strokeWidth="0.9" />
                    <circle cx="27.5" cy="13.5" r="1.8" fill="#8FAF8B" stroke="currentColor" strokeWidth="0.9" />
                    <circle cx="23.5" cy="26.5" r="1.8" fill="#8FAF8B" stroke="currentColor" strokeWidth="0.9" />
                    <circle cx="12.5" cy="26.5" r="1.8" fill="#8FAF8B" stroke="currentColor" strokeWidth="0.9" />
                    <circle cx="8.5" cy="13.5" r="1.8" fill="#8FAF8B" stroke="currentColor" strokeWidth="0.9" />
                    {/* Central Glowing Nexus Node */}
                    <circle cx="18" cy="18" r="3.4" fill="url(#patternNexusGrad)" stroke="#17324D" strokeWidth="1.1" />
                    <circle cx="18" cy="18" r="1.1" fill="#FFFFFF" />
                </svg>
            );

        case "attention":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`vyom-domain-svg vyom-svg-attention ${className}`}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="attentionCoreGrad" x1="15" y1="15" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#F87171" />
                            <stop offset="100%" stopColor="#E07A5F" />
                        </linearGradient>
                    </defs>
                    {/* Concentric Radar Rings */}
                    <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 2.5" fill="none" opacity="0.45" />
                    <circle cx="18" cy="18" r="7.8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8" />
                    {/* Coordinate Alignment Crosshairs */}
                    <path d="M18 3.5V7M18 29V32.5M3.5 18H7M29 18H32.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    {/* Concentrated Focal Core */}
                    <circle cx="18" cy="18" r="3.6" fill="url(#attentionCoreGrad)" stroke="#17324D" strokeWidth="1.1" />
                    <circle cx="18" cy="18" r="1.2" fill="#FFFFFF" />
                    {/* Dynamic Focal Beam Sparks */}
                    <path d="M13 13L14.5 14.5M23 13L21.5 14.5M13 23L14.5 21.5M23 23L21.5 21.5" stroke="#E07A5F" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
                </svg>
            );

        case "navigation":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`vyom-domain-svg vyom-svg-navigation ${className}`}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="navPathGrad" x1="8" y1="26" x2="28" y2="12" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#38BDF8" />
                            <stop offset="100%" stopColor="#4F7C78" />
                        </linearGradient>
                    </defs>
                    {/* Compass Bezel */}
                    <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.75" />
                    <circle cx="18" cy="18" r="9.2" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.8 1.8" fill="none" opacity="0.4" />
                    {/* Curved Spatial Route Path */}
                    <path
                        d="M8 25.5C10.5 20 12.5 14 17.5 11C22 8.5 26.5 12 27.5 17.5"
                        stroke="url(#navPathGrad)"
                        strokeWidth="1.4"
                        strokeDasharray="2.2 2.2"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.85"
                    />
                    <circle cx="27.5" cy="17.5" r="1.5" fill="#38BDF8" />
                    {/* Faceted Precision Compass Needle */}
                    <polygon points="18,7.5 21.5,18 18,16" fill="#E07A5F" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
                    <polygon points="18,7.5 14.5,18 18,16" fill="#F87171" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
                    <polygon points="18,28.5 21.5,18 18,20" fill="#17324D" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
                    <polygon points="18,28.5 14.5,18 18,20" fill="#4F7C78" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
                    {/* Central Needle Pivot */}
                    <circle cx="18" cy="18" r="1.6" fill="#F7F4EC" stroke="#17324D" strokeWidth="0.9" />
                </svg>
            );

        case "language":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`vyom-domain-svg vyom-svg-language ${className}`}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="speechBubbleGrad" x1="7" y1="7" x2="29" y2="27" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#8FAF8B" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#4F7C78" stopOpacity="0.28" />
                        </linearGradient>
                    </defs>
                    {/* Acoustic Speech Bubble Contour */}
                    <path
                        d="M7 16.5C7 11.2 11.5 7 18 7C24.5 7 29 11.2 29 16.5C29 21.8 24.5 26 18 26C15.9 26 13.9 25.4 12.2 24.4L7 26.2L8.4 21.8C7.5 20.2 7 18.4 7 16.5Z"
                        fill="url(#speechBubbleGrad)"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                    {/* Internal Harmonic Waveform Bars */}
                    <path
                        d="M12.5 16.5V16.51M15.2 13.5V19.5M18 11V22M20.8 12.5V20.5M23.5 15V18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    {/* Radiating Acoustic Resonance Ripples */}
                    <path
                        d="M29.5 12.5C31 13.8 31.8 15.3 31.8 17C31.8 18.7 31 20.2 29.5 21.5"
                        stroke="#D8B878"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.8"
                    />
                </svg>
            );

        default:
            return null;
    }
}
