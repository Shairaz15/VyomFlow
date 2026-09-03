import { useTheme } from '../../contexts/ThemeContext';

export interface VyomFlowLogoProps {
    variant?: 'full' | 'icon' | 'wordmark';
    theme?: 'light' | 'dark' | 'auto';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    height?: number | string;
    onClick?: () => void;
}

/**
 * Official VyomFlow Brand Logo Component
 * - Brain-shaped outline with stylized "V"
 * - Neural / network lines with blue/cyan/teal gradients & circuit nodes
 * - Clean geometric "VyomFlow" wordmark
 */
export function VyomFlowLogo({
    variant = 'full',
    theme = 'auto',
    size = 'md',
    className = '',
    iconClassName = '',
    textClassName = '',
    height,
    onClick,
}: VyomFlowLogoProps) {
    const { theme: currentTheme } = useTheme();
    const isDark = theme === 'auto' ? currentTheme === 'dark' : theme === 'dark';

    // Size presets
    const sizeMap = {
        xs: { icon: 24, text: 'text-lg', gap: 'gap-2' },
        sm: { icon: 28, text: 'text-xl', gap: 'gap-2.5' },
        md: { icon: 34, text: 'text-2xl', gap: 'gap-3' },
        lg: { icon: 42, text: 'text-3xl', gap: 'gap-3.5' },
        xl: { icon: 54, text: 'text-4xl', gap: 'gap-4' },
        custom: { icon: 34, text: 'text-2xl', gap: 'gap-3' },
    };

    const currentSize = sizeMap[size] || sizeMap.md;
    const iconDim = height || currentSize.icon;

    // Wordmark Color
    const wordmarkColor = isDark ? '#FFFFFF' : '#17324D';
    // Center V Color
    const vColor = isDark ? '#FFFFFF' : '#17324D';

    const IconSvg = (
        <svg
            width={iconDim}
            height={iconDim}
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`shrink-0 transition-transform duration-300 ${iconClassName}`}
            aria-label="VyomFlow Neural Brain Logo"
        >
            <defs>
                {/* Outer Brain Contour Gradient: Cyan -> Electric Blue -> Navy */}
                <linearGradient id="vyomBrainContour" x1="15" y1="15" x2="125" y2="125" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00C9B7" />
                    <stop offset="45%" stopColor="#0088E8" />
                    <stop offset="100%" stopColor="#1C4B82" />
                </linearGradient>

                {/* Upper Neural Circuit Gradient: Bright Aqua -> Cyan */}
                <linearGradient id="vyomNeuralUpper" x1="40" y1="20" x2="120" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00E5C8" />
                    <stop offset="60%" stopColor="#00B4D8" />
                    <stop offset="100%" stopColor="#0077B6" />
                </linearGradient>

                {/* Inner Neural Circuit Gradient: Deep Sky -> Royal Blue */}
                <linearGradient id="vyomNeuralInner" x1="25" y1="50" x2="115" y2="110" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0096C7" />
                    <stop offset="70%" stopColor="#023E8A" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>

                {/* Node Glow Filter */}
                <filter id="vyomNodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* 1. OUTER BRAIN SILHOUETTE PROFILE */}
            <path
                d="M 68 116 
                   C 60 110, 52 98, 42 92
                   C 32 86, 20 84, 18 70
                   C 16 54, 26 38, 38 28
                   C 52 16, 74 16, 92 22
                   C 108 28, 122 42, 125 58
                   C 127 72, 122 86, 112 96
                   C 104 104, 94 108, 86 107
                   C 78 106, 73 112, 68 116 Z"
                stroke="url(#vyomBrainContour)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 2. INNER CEREBELLUM / TEMPORAL UNDERSIDE LOOP */}
            <path
                d="M 22 72 
                   C 26 80, 36 84, 46 84
                   C 58 84, 66 94, 68 108
                   C 72 100, 78 96, 88 95
                   C 98 94, 110 88, 114 78
                   C 118 68, 116 52, 106 42"
                stroke="url(#vyomNeuralInner)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 3. UPPER PARIETAL / FRONTAL NEURAL CIRCUIT TRACK */}
            <path
                d="M 38 38 
                   C 50 26, 72 26, 88 32
                   C 102 38, 112 50, 112 64
                   C 112 76, 104 86, 96 90"
                stroke="url(#vyomNeuralUpper)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 4. TRANS-HEMISPHERIC SYNAPTIC BRIDGE LINES */}
            {/* Bridge 1: Top-Left to Center */}
            <path
                d="M 48 32 L 62 48"
                stroke="#00C9B7"
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            {/* Bridge 2: Top-Center to Right Node */}
            <path
                d="M 76 28 L 98 44"
                stroke="#00B4D8"
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            {/* Bridge 3: Mid-Right to Outer Node */}
            <path
                d="M 92 48 L 118 48"
                stroke="#00C9B7"
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            {/* Bridge 4: Lower-Right Neural Branch */}
            <path
                d="M 94 74 L 114 68"
                stroke="#0096C7"
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            {/* Bridge 5: Left Frontal Loop Branch */}
            <path
                d="M 28 60 L 46 68"
                stroke="#0088E8"
                strokeWidth="3.5"
                strokeLinecap="round"
            />

            {/* 5. NEURAL CIRCUIT NETWORK NODES (Solid Dots) */}
            <circle cx="118" cy="48" r="4.5" fill="#00C9B7" />
            <circle cx="98" cy="44" r="4" fill="#00E5C8" />
            <circle cx="114" cy="68" r="4" fill="#00B4D8" />
            <circle cx="94" cy="74" r="3.8" fill="#0096C7" />
            <circle cx="76" cy="28" r="4" fill="#00C9B7" />
            <circle cx="28" cy="60" r="3.8" fill="#0088E8" />
            <circle cx="70" cy="100" r="3.5" fill="#0077B6" />

            {/* 6. CENTRAL ICONIC STYLIZED "V" */}
            <path
                d="M 52 52 
                   L 66 84 
                   L 84 52"
                stroke={vColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    if (variant === 'icon') {
        return (
            <div
                className={`inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
                onClick={onClick}
            >
                {IconSvg}
            </div>
        );
    }

    if (variant === 'wordmark') {
        return (
            <span
                className={`font-sans font-bold tracking-tight select-none ${currentSize.text} ${textClassName}`}
                style={{ color: wordmarkColor }}
                onClick={onClick}
            >
                VyomFlow
            </span>
        );
    }

    return (
        <div
            className={`inline-flex items-center ${currentSize.gap} select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            {IconSvg}
            <span
                className={`font-sans font-bold tracking-tight leading-none ${currentSize.text} ${textClassName}`}
                style={{ color: wordmarkColor }}
            >
                VyomFlow
            </span>
        </div>
    );
}
