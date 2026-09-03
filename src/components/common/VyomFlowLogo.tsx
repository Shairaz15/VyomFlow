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

    // Wordmark Color (Harmonious soft white for dark themes)
    const wordmarkColor = isDark ? '#F7F4EC' : '#17324D';

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
            {isDark && (
                <defs>
                    <filter id="vyomBrandLogoDarkFilter" x="-20%" y="-20%" width="140%" height="140%">
                        <feColorMatrix
                            type="matrix"
                            values="
                                1.3  0.1  0.1  0  0.28
                                0.1  1.5  0.3  0  0.48
                                0.1  0.3  1.7  0  0.58
                                0    0    0    1  0"
                        />
                        <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#5EEAD4" floodOpacity="0.35" />
                    </filter>
                </defs>
            )}
            <image
                href="/images/vyomflow-brand-logo.png"
                width="140"
                height="140"
                preserveAspectRatio="xMidYMid meet"
                filter={isDark ? "url(#vyomBrandLogoDarkFilter)" : undefined}
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
