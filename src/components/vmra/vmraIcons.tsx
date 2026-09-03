/**
 * VMRA Inline SVG Icons
 * 
 * Simple, flat vector icons for Indian-context objects.
 * Style: thick outlines (2-3px), solid fill, warm saturated colors.
 * Each icon is 80x80 viewBox for consistency.
 * 
 * These are intentionally simple/iconic — NOT realistic illustrations.
 * Designed for instant recognition by rural Indian users.
 */

import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

const defaultSize = 80;

// Helper to wrap all icons consistently
const IconWrapper: React.FC<IconProps & { children: React.ReactNode }> = ({ size = defaultSize, className, children }) => (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

// ─── FRUITS & VEGETABLES ──────────────────────────────────────────

export const MangoIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="18" ry="22" fill="#FFB300" stroke="#E65100" strokeWidth="2.5" />
        <path d="M40 20 Q42 10 48 8" stroke="#388E3C" strokeWidth="2.5" fill="none" />
        <ellipse cx="46" cy="10" rx="6" ry="4" fill="#4CAF50" />
    </IconWrapper>
);

export const BananaIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M20 55 Q25 20 40 15 Q55 20 50 55" fill="#FFD600" stroke="#F9A825" strokeWidth="2.5" />
        <path d="M25 50 Q30 25 40 20 Q50 25 48 50" fill="#FFEE58" stroke="none" />
        <path d="M38 15 L40 8" stroke="#795548" strokeWidth="2.5" />
    </IconWrapper>
);

export const CoconutIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="40" cy="44" r="20" fill="#795548" stroke="#4E342E" strokeWidth="2.5" />
        <circle cx="34" cy="38" r="3" fill="#3E2723" />
        <circle cx="46" cy="38" r="3" fill="#3E2723" />
        <circle cx="40" cy="48" r="3" fill="#3E2723" />
    </IconWrapper>
);

export const WatermelonIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M15 50 A30 30 0 0 1 65 50 Z" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2.5" />
        <path d="M20 50 A25 25 0 0 1 60 50 Z" fill="#EF5350" />
        <circle cx="32" cy="45" r="2" fill="#212121" />
        <circle cx="40" cy="42" r="2" fill="#212121" />
        <circle cx="48" cy="45" r="2" fill="#212121" />
    </IconWrapper>
);

export const PomegranateIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="40" cy="44" r="18" fill="#C62828" stroke="#B71C1C" strokeWidth="2.5" />
        <path d="M34 26 L40 20 L46 26" fill="#C62828" stroke="#B71C1C" strokeWidth="2.5" />
        <circle cx="35" cy="42" r="3" fill="#EF9A9A" />
        <circle cx="45" cy="42" r="3" fill="#EF9A9A" />
        <circle cx="40" cy="50" r="3" fill="#EF9A9A" />
    </IconWrapper>
);

export const LemonIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="16" ry="14" fill="#FDD835" stroke="#F9A825" strokeWidth="2.5" />
        <ellipse cx="28" cy="42" rx="4" ry="3" fill="#FFEE58" />
        <ellipse cx="52" cy="42" rx="4" ry="3" fill="#FFEE58" />
    </IconWrapper>
);

export const LimeIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="15" ry="13" fill="#7CB342" stroke="#558B2F" strokeWidth="2.5" />
        <ellipse cx="28" cy="42" rx="4" ry="3" fill="#9CCC65" />
        <ellipse cx="52" cy="42" rx="4" ry="3" fill="#9CCC65" />
    </IconWrapper>
);

export const ChiliIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M25 55 Q20 35 35 20 Q45 15 45 20 Q48 35 35 55 Z" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2.5" />
        <path d="M35 20 Q38 10 42 12" stroke="#33691E" strokeWidth="2.5" fill="none" />
    </IconWrapper>
);

export const BrinjalIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="48" rx="14" ry="18" fill="#7B1FA2" stroke="#4A148C" strokeWidth="2.5" />
        <path d="M34 30 L40 22 L46 30" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2" />
    </IconWrapper>
);

export const OnionIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="46" rx="16" ry="18" fill="#CE93D8" stroke="#7B1FA2" strokeWidth="2.5" />
        <path d="M40 28 L40 16" stroke="#7B1FA2" strokeWidth="2.5" />
        <path d="M36 30 Q40 24 44 30" fill="#E1BEE7" stroke="none" />
    </IconWrapper>
);

export const TomatoIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="40" cy="44" r="18" fill="#F44336" stroke="#C62828" strokeWidth="2.5" />
        <path d="M30 28 Q40 22 50 28" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2" />
    </IconWrapper>
);

export const PapayaIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="15" ry="22" fill="#FF9800" stroke="#E65100" strokeWidth="2.5" />
        <ellipse cx="40" cy="42" rx="6" ry="10" fill="#FFE0B2" />
        <circle cx="38" cy="38" r="2" fill="#212121" />
        <circle cx="42" cy="44" r="2" fill="#212121" />
    </IconWrapper>
);

// ─── KITCHEN ITEMS ────────────────────────────────────────────────

export const PressureCookerIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="22" y="30" width="36" height="30" rx="4" fill="#BDBDBD" stroke="#616161" strokeWidth="2.5" />
        <rect x="20" y="26" width="40" height="6" rx="2" fill="#9E9E9E" stroke="#616161" strokeWidth="2" />
        <circle cx="40" cy="22" r="4" fill="#F44336" stroke="#C62828" strokeWidth="2" />
        <path d="M56 40 Q60 40 58 36" stroke="#616161" strokeWidth="2.5" fill="none" />
    </IconWrapper>
);

export const SteelTumblerIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M28 22 L24 62 L56 62 L52 22 Z" fill="#E0E0E0" stroke="#757575" strokeWidth="2.5" />
        <ellipse cx="40" cy="22" rx="12" ry="4" fill="#BDBDBD" stroke="#757575" strokeWidth="2" />
    </IconWrapper>
);

export const ChaiCupIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M22 28 L26 58 L54 58 L58 28 Z" fill="#FFF8E1" stroke="#795548" strokeWidth="2.5" />
        <path d="M58 34 Q68 34 68 44 Q68 54 58 54" stroke="#795548" strokeWidth="2.5" fill="none" />
        <rect x="22" y="58" width="36" height="4" rx="2" fill="#795548" />
        <path d="M30 38 Q40 32 50 38" stroke="#795548" strokeWidth="1.5" fill="none" opacity="0.4" />
    </IconWrapper>
);

export const SteelGlassIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M26 20 L24 60 L56 60 L54 20 Z" fill="#E0E0E0" stroke="#757575" strokeWidth="2.5" />
        <ellipse cx="40" cy="20" rx="14" ry="5" fill="#BDBDBD" stroke="#757575" strokeWidth="2" />
    </IconWrapper>
);

export const TawaIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="44" rx="22" ry="8" fill="#424242" stroke="#212121" strokeWidth="2.5" />
        <line x1="62" y1="44" x2="72" y2="38" stroke="#616161" strokeWidth="3" />
    </IconWrapper>
);

export const SteelPlateIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="44" rx="24" ry="10" fill="#E0E0E0" stroke="#757575" strokeWidth="2.5" />
        <ellipse cx="40" cy="44" rx="16" ry="6" fill="#BDBDBD" stroke="#9E9E9E" strokeWidth="1.5" />
    </IconWrapper>
);

export const RollingPinIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="18" y="36" width="44" height="10" rx="5" fill="#D7CCC8" stroke="#795548" strokeWidth="2.5" />
        <rect x="10" y="38" width="10" height="6" rx="3" fill="#A1887F" stroke="#795548" strokeWidth="2" />
        <rect x="60" y="38" width="10" height="6" rx="3" fill="#A1887F" stroke="#795548" strokeWidth="2" />
    </IconWrapper>
);

export const LadleIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <line x1="40" y1="18" x2="40" y2="45" stroke="#757575" strokeWidth="3" />
        <ellipse cx="40" cy="52" rx="14" ry="10" fill="#BDBDBD" stroke="#757575" strokeWidth="2.5" />
    </IconWrapper>
);

export const MatkaIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#D84315" stroke="#BF360C" strokeWidth="2.5" />
        <path d="M30 34 Q40 28 50 34" fill="#D84315" stroke="#BF360C" strokeWidth="2.5" />
        <ellipse cx="40" cy="34" rx="8" ry="4" fill="#BF360C" stroke="#8D6E63" strokeWidth="2" />
    </IconWrapper>
);

export const SteelPotIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="22" y="32" width="36" height="28" rx="4" fill="#E0E0E0" stroke="#757575" strokeWidth="2.5" />
        <rect x="20" y="28" width="40" height="6" rx="2" fill="#BDBDBD" stroke="#757575" strokeWidth="2" />
        <path d="M18 40 Q14 40 14 36" stroke="#757575" strokeWidth="2.5" fill="none" />
        <path d="M62 40 Q66 40 66 36" stroke="#757575" strokeWidth="2.5" fill="none" />
    </IconWrapper>
);

// ─── TRANSPORT ────────────────────────────────────────────────────

export const AutoRickshawIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="16" y="28" width="48" height="26" rx="6" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2.5" />
        <rect x="22" y="32" width="16" height="12" rx="2" fill="#E3F2FD" stroke="#2E7D32" strokeWidth="1.5" />
        <circle cx="24" cy="60" r="6" fill="#212121" stroke="#424242" strokeWidth="2" />
        <circle cx="56" cy="60" r="6" fill="#212121" stroke="#424242" strokeWidth="2" />
        <path d="M40 28 L40 18 L50 18" stroke="#2E7D32" strokeWidth="2.5" fill="none" />
    </IconWrapper>
);

export const BusIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="10" y="24" width="60" height="30" rx="4" fill="#F44336" stroke="#C62828" strokeWidth="2.5" />
        <rect x="16" y="28" width="12" height="10" rx="2" fill="#E3F2FD" stroke="#C62828" strokeWidth="1.5" />
        <rect x="34" y="28" width="12" height="10" rx="2" fill="#E3F2FD" stroke="#C62828" strokeWidth="1.5" />
        <rect x="52" y="28" width="12" height="10" rx="2" fill="#E3F2FD" stroke="#C62828" strokeWidth="1.5" />
        <circle cx="22" cy="58" r="5" fill="#212121" stroke="#424242" strokeWidth="2" />
        <circle cx="58" cy="58" r="5" fill="#212121" stroke="#424242" strokeWidth="2" />
    </IconWrapper>
);

export const BicycleIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="24" cy="50" r="12" fill="none" stroke="#1565C0" strokeWidth="2.5" />
        <circle cx="56" cy="50" r="12" fill="none" stroke="#1565C0" strokeWidth="2.5" />
        <path d="M24 50 L36 30 L56 50 L36 30 L44 30" stroke="#1565C0" strokeWidth="2.5" fill="none" />
        <line x1="36" y1="30" x2="30" y2="24" stroke="#1565C0" strokeWidth="2.5" />
        <line x1="26" y1="24" x2="34" y2="24" stroke="#1565C0" strokeWidth="2.5" />
    </IconWrapper>
);

export const MotorcycleIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="20" cy="52" r="10" fill="none" stroke="#212121" strokeWidth="2.5" />
        <circle cx="60" cy="52" r="10" fill="none" stroke="#212121" strokeWidth="2.5" />
        <path d="M20 52 L30 34 L50 30 L60 52" stroke="#F44336" strokeWidth="3" fill="none" />
        <rect x="28" y="28" width="24" height="8" rx="4" fill="#F44336" stroke="#C62828" strokeWidth="2" />
    </IconWrapper>
);

export const BullockCartIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="30" y="34" width="30" height="16" fill="#8D6E63" stroke="#5D4037" strokeWidth="2.5" />
        <circle cx="36" cy="56" r="8" fill="none" stroke="#5D4037" strokeWidth="2.5" />
        <circle cx="54" cy="56" r="8" fill="none" stroke="#5D4037" strokeWidth="2.5" />
        <line x1="30" y1="42" x2="14" y2="36" stroke="#5D4037" strokeWidth="2.5" />
    </IconWrapper>
);

export const TrainIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="12" y="26" width="56" height="28" rx="6" fill="#1565C0" stroke="#0D47A1" strokeWidth="2.5" />
        <rect x="18" y="30" width="10" height="8" rx="2" fill="#E3F2FD" />
        <rect x="34" y="30" width="10" height="8" rx="2" fill="#E3F2FD" />
        <circle cx="22" cy="58" r="5" fill="#212121" stroke="#424242" strokeWidth="2" />
        <circle cx="40" cy="58" r="5" fill="#212121" stroke="#424242" strokeWidth="2" />
        <circle cx="58" cy="58" r="5" fill="#212121" stroke="#424242" strokeWidth="2" />
        <rect x="56" y="18" width="6" height="10" rx="2" fill="#FDD835" />
    </IconWrapper>
);

export const TractorIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="20" y="28" width="36" height="20" rx="4" fill="#FF9800" stroke="#E65100" strokeWidth="2.5" />
        <circle cx="22" cy="56" r="8" fill="#212121" stroke="#424242" strokeWidth="2.5" />
        <circle cx="54" cy="52" r="12" fill="#212121" stroke="#424242" strokeWidth="2.5" />
        <rect x="50" y="18" width="8" height="12" rx="2" fill="#FF9800" stroke="#E65100" strokeWidth="2" />
    </IconWrapper>
);

export const TempoIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="8" y="28" width="48" height="26" rx="4" fill="#2196F3" stroke="#1565C0" strokeWidth="2.5" />
        <rect x="54" y="32" width="16" height="22" rx="4" fill="#E3F2FD" stroke="#1565C0" strokeWidth="2" />
        <circle cx="20" cy="58" r="5" fill="#212121" stroke="#424242" strokeWidth="2" />
        <circle cx="62" cy="58" r="5" fill="#212121" stroke="#424242" strokeWidth="2" />
    </IconWrapper>
);

// ─── ANIMALS ──────────────────────────────────────────────────────

export const CowIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="20" ry="14" fill="#FFF8E1" stroke="#795548" strokeWidth="2.5" />
        <circle cx="26" cy="30" r="6" fill="#FFF8E1" stroke="#795548" strokeWidth="2" />
        <circle cx="24" cy="28" r="2" fill="#212121" />
        <path d="M20 24 L16 18" stroke="#795548" strokeWidth="2.5" />
        <path d="M32 24 L34 18" stroke="#795548" strokeWidth="2.5" />
        <line x1="28" y1="56" x2="28" y2="66" stroke="#795548" strokeWidth="2.5" />
        <line x1="52" y1="56" x2="52" y2="66" stroke="#795548" strokeWidth="2.5" />
    </IconWrapper>
);

export const BuffaloIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="20" ry="14" fill="#424242" stroke="#212121" strokeWidth="2.5" />
        <circle cx="26" cy="30" r="6" fill="#424242" stroke="#212121" strokeWidth="2" />
        <circle cx="24" cy="28" r="2" fill="#FDD835" />
        <path d="M18 24 Q14 16 10 18" stroke="#616161" strokeWidth="3" />
        <path d="M34 24 Q36 16 40 18" stroke="#616161" strokeWidth="3" />
        <line x1="28" y1="56" x2="28" y2="66" stroke="#212121" strokeWidth="2.5" />
        <line x1="52" y1="56" x2="52" y2="66" stroke="#212121" strokeWidth="2.5" />
    </IconWrapper>
);

export const DogIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="42" cy="44" rx="16" ry="12" fill="#D7CCC8" stroke="#795548" strokeWidth="2.5" />
        <circle cx="28" cy="34" r="8" fill="#D7CCC8" stroke="#795548" strokeWidth="2" />
        <circle cx="26" cy="32" r="2" fill="#212121" />
        <ellipse cx="30" cy="38" rx="3" ry="2" fill="#212121" />
        <path d="M22 28 L16 22" stroke="#795548" strokeWidth="2.5" />
        <path d="M34 28 L38 22" stroke="#795548" strokeWidth="2.5" />
        <path d="M58 44 Q64 42 66 46" stroke="#795548" strokeWidth="2.5" fill="none" />
    </IconWrapper>
);

export const GoatIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="42" cy="42" rx="16" ry="12" fill="#EFEBE9" stroke="#795548" strokeWidth="2.5" />
        <circle cx="28" cy="32" r="7" fill="#EFEBE9" stroke="#795548" strokeWidth="2" />
        <circle cx="26" cy="30" r="2" fill="#212121" />
        <path d="M22 26 L18 18" stroke="#795548" strokeWidth="2.5" />
        <path d="M34 26 L36 18" stroke="#795548" strokeWidth="2.5" />
        <path d="M30 38 L30 40" stroke="#795548" strokeWidth="2" fill="none" />
        <line x1="32" y1="54" x2="32" y2="64" stroke="#795548" strokeWidth="2.5" />
        <line x1="52" y1="54" x2="52" y2="64" stroke="#795548" strokeWidth="2.5" />
    </IconWrapper>
);

export const CrowIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="12" ry="16" fill="#212121" stroke="#000" strokeWidth="2" />
        <circle cx="36" cy="30" r="8" fill="#212121" stroke="#000" strokeWidth="2" />
        <circle cx="34" cy="28" r="2" fill="#FDD835" />
        <path d="M28 30 L22 28" stroke="#FF9800" strokeWidth="2.5" />
        <path d="M28 50 L18 60" stroke="#212121" strokeWidth="2.5" />
        <path d="M52 50 L62 60" stroke="#212121" strokeWidth="2.5" />
    </IconWrapper>
);

export const ParrotIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="42" rx="10" ry="16" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2.5" />
        <circle cx="38" cy="28" r="8" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2" />
        <circle cx="36" cy="26" r="2" fill="#212121" />
        <path d="M30 28 L24 26" stroke="#F44336" strokeWidth="3" />
        <path d="M40 58 L36 68" stroke="#FF9800" strokeWidth="2.5" />
        <path d="M40 58 L44 68" stroke="#FF9800" strokeWidth="2.5" />
    </IconWrapper>
);

export const PeacockIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M20 20 Q40 8 60 20 Q56 36 40 42 Q24 36 20 20 Z" fill="#1565C0" stroke="#0D47A1" strokeWidth="2" />
        <circle cx="30" cy="22" r="4" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1.5" />
        <circle cx="50" cy="22" r="4" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1.5" />
        <circle cx="40" cy="16" r="4" fill="#4CAF50" stroke="#1B5E20" strokeWidth="1.5" />
        <ellipse cx="40" cy="52" rx="8" ry="12" fill="#1565C0" stroke="#0D47A1" strokeWidth="2" />
        <circle cx="38" cy="46" r="2" fill="#212121" />
        <path d="M36 50 L32 48" stroke="#FF9800" strokeWidth="2" />
    </IconWrapper>
);

export const ElephantIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="42" cy="40" rx="20" ry="16" fill="#9E9E9E" stroke="#616161" strokeWidth="2.5" />
        <circle cx="24" cy="30" r="10" fill="#9E9E9E" stroke="#616161" strokeWidth="2" />
        <circle cx="22" cy="28" r="2" fill="#212121" />
        <path d="M18 36 Q14 50 16 58" stroke="#616161" strokeWidth="3" fill="none" />
        <path d="M30 56 L30 66" stroke="#616161" strokeWidth="3" />
        <path d="M54 56 L54 66" stroke="#616161" strokeWidth="3" />
    </IconWrapper>
);

// ─── HOUSEHOLD ────────────────────────────────────────────────────

export const BroomIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <line x1="40" y1="12" x2="40" y2="48" stroke="#8D6E63" strokeWidth="3" />
        <path d="M28 48 L40 48 L52 48 L50 68 L30 68 Z" fill="#FDD835" stroke="#F9A825" strokeWidth="2" />
        <line x1="32" y1="48" x2="30" y2="68" stroke="#F9A825" strokeWidth="1.5" />
        <line x1="40" y1="48" x2="40" y2="68" stroke="#F9A825" strokeWidth="1.5" />
        <line x1="48" y1="48" x2="50" y2="68" stroke="#F9A825" strokeWidth="1.5" />
    </IconWrapper>
);

export const CeilingFanIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="40" cy="40" r="6" fill="#BDBDBD" stroke="#757575" strokeWidth="2" />
        <path d="M40 34 L38 10 L42 10 Z" fill="#90A4AE" stroke="#607D8B" strokeWidth="1.5" />
        <path d="M46 40 L66 32 L68 36 Z" fill="#90A4AE" stroke="#607D8B" strokeWidth="1.5" />
        <path d="M40 46 L42 70 L38 70 Z" fill="#90A4AE" stroke="#607D8B" strokeWidth="1.5" />
        <path d="M34 40 L14 48 L12 44 Z" fill="#90A4AE" stroke="#607D8B" strokeWidth="1.5" />
        <line x1="40" y1="6" x2="40" y2="2" stroke="#757575" strokeWidth="2" />
    </IconWrapper>
);

export const BucketIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M22 28 L18 62 L62 62 L58 28 Z" fill="#2196F3" stroke="#1565C0" strokeWidth="2.5" />
        <path d="M26 28 Q40 18 54 28" stroke="#1565C0" strokeWidth="2.5" fill="none" />
    </IconWrapper>
);

export const CharpaiIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="12" y="36" width="56" height="4" rx="2" fill="#8D6E63" stroke="#5D4037" strokeWidth="2" />
        <line x1="16" y1="40" x2="16" y2="60" stroke="#5D4037" strokeWidth="3" />
        <line x1="64" y1="40" x2="64" y2="60" stroke="#5D4037" strokeWidth="3" />
        <line x1="16" y1="36" x2="16" y2="26" stroke="#5D4037" strokeWidth="3" />
        <line x1="64" y1="36" x2="64" y2="26" stroke="#5D4037" strokeWidth="3" />
        <line x1="20" y1="38" x2="60" y2="38" stroke="#D7CCC8" strokeWidth="1" opacity="0.6" />
    </IconWrapper>
);

export const LanternIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="30" y="24" width="20" height="36" rx="4" fill="#FDD835" stroke="#F9A825" strokeWidth="2.5" />
        <rect x="28" y="20" width="24" height="6" rx="2" fill="#757575" stroke="#616161" strokeWidth="2" />
        <rect x="28" y="58" width="24" height="6" rx="2" fill="#757575" stroke="#616161" strokeWidth="2" />
        <line x1="40" y1="14" x2="40" y2="20" stroke="#757575" strokeWidth="2" />
        <ellipse cx="40" cy="42" rx="4" ry="6" fill="#FF9800" />
    </IconWrapper>
);

export const SewingMachineIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="14" y="44" width="52" height="6" rx="2" fill="#424242" stroke="#212121" strokeWidth="2" />
        <rect x="20" y="24" width="28" height="22" rx="4" fill="#757575" stroke="#424242" strokeWidth="2.5" />
        <circle cx="58" cy="36" r="8" fill="#9E9E9E" stroke="#616161" strokeWidth="2" />
        <line x1="20" y1="50" x2="20" y2="64" stroke="#424242" strokeWidth="2.5" />
        <line x1="60" y1="50" x2="60" y2="64" stroke="#424242" strokeWidth="2.5" />
    </IconWrapper>
);

export const UmbrellaIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M10 40 Q40 8 70 40" fill="#F44336" stroke="#C62828" strokeWidth="2.5" />
        <line x1="40" y1="40" x2="40" y2="66" stroke="#795548" strokeWidth="2.5" />
        <path d="M40 66 Q36 70 34 66" stroke="#795548" strokeWidth="2.5" fill="none" />
    </IconWrapper>
);

// ─── NATURE & OUTDOORS ────────────────────────────────────────────

export const BanyanTreeIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="36" y="44" width="8" height="22" fill="#795548" stroke="#5D4037" strokeWidth="2" />
        <circle cx="40" cy="32" r="20" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2.5" />
        <path d="M28 40 L26 66" stroke="#8D6E63" strokeWidth="2" />
        <path d="M52 40 L54 66" stroke="#8D6E63" strokeWidth="2" />
    </IconWrapper>
);

export const CoconutTreeIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M38 68 Q36 40 40 20" stroke="#8D6E63" strokeWidth="4" fill="none" />
        <path d="M40 20 L30 12 M40 20 L50 14 M40 20 L40 10 M40 20 L28 18 M40 20 L52 18" stroke="#4CAF50" strokeWidth="2.5" fill="none" />
        <circle cx="36" cy="22" r="3" fill="#795548" />
        <circle cx="44" cy="22" r="3" fill="#795548" />
    </IconWrapper>
);

export const LotusIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="50" rx="20" ry="6" fill="#E1F5FE" stroke="#4FC3F7" strokeWidth="1.5" />
        <path d="M40 46 Q36 30 28 34 Q32 24 40 20 Q48 24 52 34 Q44 30 40 46Z" fill="#F48FB1" stroke="#E91E63" strokeWidth="2" />
        <path d="M40 46 Q34 36 24 40 Q30 32 40 28 Q50 32 56 40 Q46 36 40 46Z" fill="#EC407A" stroke="#C2185B" strokeWidth="1.5" />
    </IconWrapper>
);

export const SunflowerIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="40" cy="34" r="8" fill="#5D4037" stroke="#3E2723" strokeWidth="2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <ellipse
                key={angle}
                cx="40"
                cy="20"
                rx="5"
                ry="10"
                fill="#FDD835"
                stroke="#F9A825"
                strokeWidth="1.5"
                transform={`rotate(${angle} 40 34)`}
            />
        ))}
        <line x1="40" y1="42" x2="40" y2="68" stroke="#4CAF50" strokeWidth="3" />
    </IconWrapper>
);

export const WellIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="50" rx="20" ry="10" fill="#90A4AE" stroke="#607D8B" strokeWidth="2.5" />
        <rect x="20" y="42" width="40" height="10" fill="#A1887F" stroke="#795548" strokeWidth="2" />
        <line x1="24" y1="42" x2="24" y2="22" stroke="#795548" strokeWidth="2.5" />
        <line x1="56" y1="42" x2="56" y2="22" stroke="#795548" strokeWidth="2.5" />
        <line x1="24" y1="22" x2="56" y2="22" stroke="#795548" strokeWidth="2.5" />
    </IconWrapper>
);

export const RiverIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M0 35 Q20 25 40 35 Q60 45 80 35" fill="none" stroke="#1E88E5" strokeWidth="3" />
        <path d="M0 45 Q20 35 40 45 Q60 55 80 45" fill="none" stroke="#42A5F5" strokeWidth="2.5" />
        <path d="M0 55 Q20 45 40 55 Q60 65 80 55" fill="none" stroke="#64B5F6" strokeWidth="2" />
    </IconWrapper>
);

export const FieldIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="5" y="40" width="70" height="30" fill="#81C784" stroke="#388E3C" strokeWidth="2" />
        <line x1="5" y1="50" x2="75" y2="50" stroke="#4CAF50" strokeWidth="1.5" />
        <line x1="5" y1="60" x2="75" y2="60" stroke="#4CAF50" strokeWidth="1.5" />
        <path d="M30 40 L30 28 Q32 22 28 22" stroke="#8D6E63" strokeWidth="2" fill="none" />
        <path d="M50 40 L50 30 Q52 24 48 24" stroke="#8D6E63" strokeWidth="2" fill="none" />
    </IconWrapper>
);

export const HillIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M5 65 L30 20 L55 65 Z" fill="#66BB6A" stroke="#388E3C" strokeWidth="2.5" />
        <path d="M35 65 L55 28 L75 65 Z" fill="#81C784" stroke="#43A047" strokeWidth="2.5" />
    </IconWrapper>
);

// ─── CULTURAL / RELIGIOUS ─────────────────────────────────────────

export const TempleBellIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M28 22 Q40 18 52 22 L56 52 Q40 58 24 52 Z" fill="#FDD835" stroke="#F9A825" strokeWidth="2.5" />
        <circle cx="40" cy="54" r="4" fill="#F9A825" stroke="#F57F17" strokeWidth="2" />
        <line x1="40" y1="12" x2="40" y2="18" stroke="#757575" strokeWidth="3" />
        <circle cx="40" cy="10" r="3" fill="#757575" />
    </IconWrapper>
);

export const DiyaIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M20 50 Q30 36 40 36 Q50 36 60 50 Q50 56 40 56 Q30 56 20 50 Z" fill="#D84315" stroke="#BF360C" strokeWidth="2.5" />
        <path d="M40 36 L38 24 Q40 18 42 24 L40 36" fill="#FF9800" stroke="#F57C00" strokeWidth="1.5" />
        <ellipse cx="40" cy="18" rx="3" ry="5" fill="#FDD835" />
    </IconWrapper>
);

export const RangoliIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <circle cx="40" cy="40" r="20" fill="none" stroke="#E91E63" strokeWidth="2" />
        <circle cx="40" cy="40" r="12" fill="none" stroke="#FF9800" strokeWidth="2" />
        <circle cx="40" cy="40" r="5" fill="#FDD835" stroke="#F9A825" strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
            <circle
                key={angle}
                cx={40 + 20 * Math.cos((angle * Math.PI) / 180)}
                cy={40 + 20 * Math.sin((angle * Math.PI) / 180)}
                r="3"
                fill="#4CAF50"
            />
        ))}
    </IconWrapper>
);

export const IncenseIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <line x1="40" y1="68" x2="40" y2="28" stroke="#8D6E63" strokeWidth="2" />
        <circle cx="40" cy="26" r="3" fill="#FF5722" stroke="#E64A19" strokeWidth="1.5" />
        <path d="M40 24 Q44 16 38 10 Q42 6 40 2" stroke="#9E9E9E" strokeWidth="1.5" fill="none" opacity="0.6" />
        <rect x="34" y="66" width="12" height="6" rx="2" fill="#5D4037" stroke="#3E2723" strokeWidth="1.5" />
    </IconWrapper>
);

export const FluteIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="10" y="36" width="60" height="8" rx="4" fill="#8D6E63" stroke="#5D4037" strokeWidth="2.5" />
        <circle cx="24" cy="40" r="2.5" fill="#5D4037" />
        <circle cx="34" cy="40" r="2.5" fill="#5D4037" />
        <circle cx="44" cy="40" r="2.5" fill="#5D4037" />
        <circle cx="54" cy="40" r="2.5" fill="#5D4037" />
    </IconWrapper>
);

export const DrumIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="22" rx="18" ry="6" fill="#FFF8E1" stroke="#795548" strokeWidth="2.5" />
        <rect x="22" y="22" width="36" height="34" fill="#A1887F" stroke="#795548" strokeWidth="2.5" />
        <ellipse cx="40" cy="56" rx="18" ry="6" fill="#8D6E63" stroke="#795548" strokeWidth="2.5" />
        <line x1="22" y1="30" x2="58" y2="50" stroke="#5D4037" strokeWidth="1.5" />
        <line x1="58" y1="30" x2="22" y2="50" stroke="#5D4037" strokeWidth="1.5" />
    </IconWrapper>
);

export const PrayerBeadsIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <circle
                key={angle}
                cx={40 + 18 * Math.cos((angle * Math.PI) / 180)}
                cy={40 + 18 * Math.sin((angle * Math.PI) / 180)}
                r="3.5"
                fill="#8D6E63"
                stroke="#5D4037"
                strokeWidth="1.5"
            />
        ))}
        <circle cx="40" cy="18" r="5" fill="#F44336" stroke="#C62828" strokeWidth="1.5" />
    </IconWrapper>
);

export const GarlandIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M14 20 Q28 50 40 50 Q52 50 66 20" stroke="#FF9800" strokeWidth="2.5" fill="none" />
        {[20, 28, 36, 44, 52, 60].map((x, i) => (
            <circle
                key={i}
                cx={x}
                cy={20 + Math.abs(x - 40) * 0.7}
                r="4"
                fill={i % 2 === 0 ? '#FF9800' : '#FDD835'}
                stroke={i % 2 === 0 ? '#E65100' : '#F9A825'}
                strokeWidth="1.5"
            />
        ))}
    </IconWrapper>
);

// ─── TOOLS & WORK ─────────────────────────────────────────────────

export const SickleIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M30 60 Q20 40 30 24 Q40 14 54 20" stroke="#757575" strokeWidth="3" fill="none" />
        <rect x="28" y="54" width="8" height="16" rx="2" fill="#8D6E63" stroke="#5D4037" strokeWidth="2" />
    </IconWrapper>
);

export const HammerIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="36" y="30" width="8" height="36" rx="2" fill="#8D6E63" stroke="#5D4037" strokeWidth="2" />
        <rect x="24" y="18" width="32" height="14" rx="4" fill="#757575" stroke="#424242" strokeWidth="2.5" />
    </IconWrapper>
);

export const PloughIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M16 56 Q24 40 40 36 L66 20" stroke="#795548" strokeWidth="3" fill="none" />
        <path d="M16 56 L10 64 L22 64 Z" fill="#757575" stroke="#424242" strokeWidth="2" />
    </IconWrapper>
);

export const FishingNetIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <path d="M20 16 L40 60 L60 16" stroke="#5D4037" strokeWidth="2.5" fill="none" />
        <line x1="24" y1="26" x2="56" y2="26" stroke="#8D6E63" strokeWidth="1.5" />
        <line x1="28" y1="36" x2="52" y2="36" stroke="#8D6E63" strokeWidth="1.5" />
        <line x1="32" y1="46" x2="48" y2="46" stroke="#8D6E63" strokeWidth="1.5" />
        <line x1="36" y1="56" x2="44" y2="56" stroke="#8D6E63" strokeWidth="1.5" />
    </IconWrapper>
);

export const WeavingLoomIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <rect x="14" y="20" width="52" height="44" fill="none" stroke="#795548" strokeWidth="2.5" />
        {[22, 30, 38, 46, 54].map((x) => (
            <line key={x} x1={x} y1="20" x2={x} y2="64" stroke="#D7CCC8" strokeWidth="1.5" />
        ))}
        {[28, 36, 44, 52, 60].map((y) => (
            <line key={y} x1="14" y1={y} x2="66" y2={y} stroke="#FFCC80" strokeWidth="1.5" />
        ))}
    </IconWrapper>
);

export const PottersWheelIcon: React.FC<IconProps> = (props) => (
    <IconWrapper {...props}>
        <ellipse cx="40" cy="56" rx="22" ry="8" fill="#8D6E63" stroke="#5D4037" strokeWidth="2.5" />
        <line x1="40" y1="48" x2="40" y2="36" stroke="#757575" strokeWidth="3" />
        <path d="M30 36 Q35 24 40 24 Q45 24 50 36" fill="#D84315" stroke="#BF360C" strokeWidth="2" />
    </IconWrapper>
);

// ─── ICON MAP (maps svgComponent key → React component) ───────────

export const VMRA_ICON_MAP: Record<string, React.FC<IconProps>> = {
    // Fruits
    mango: MangoIcon,
    banana: BananaIcon,
    coconut: CoconutIcon,
    watermelon: WatermelonIcon,
    pomegranate: PomegranateIcon,
    lemon: LemonIcon,
    lime: LimeIcon,
    chili: ChiliIcon,
    brinjal: BrinjalIcon,
    onion: OnionIcon,
    tomato: TomatoIcon,
    papaya: PapayaIcon,
    // Kitchen
    pressureCooker: PressureCookerIcon,
    steelTumbler: SteelTumblerIcon,
    chaiCup: ChaiCupIcon,
    steelGlass: SteelGlassIcon,
    tawa: TawaIcon,
    steelPlate: SteelPlateIcon,
    rollingPin: RollingPinIcon,
    ladle: LadleIcon,
    matka: MatkaIcon,
    steelPot: SteelPotIcon,
    // Transport
    autoRickshaw: AutoRickshawIcon,
    bus: BusIcon,
    bicycle: BicycleIcon,
    motorcycle: MotorcycleIcon,
    bullockCart: BullockCartIcon,
    train: TrainIcon,
    tractor: TractorIcon,
    tempo: TempoIcon,
    // Animals
    cow: CowIcon,
    buffalo: BuffaloIcon,
    dog: DogIcon,
    goat: GoatIcon,
    crow: CrowIcon,
    parrot: ParrotIcon,
    peacock: PeacockIcon,
    elephant: ElephantIcon,
    // Household
    broom: BroomIcon,
    ceilingFan: CeilingFanIcon,
    bucket: BucketIcon,
    charpai: CharpaiIcon,
    lantern: LanternIcon,
    sewingMachine: SewingMachineIcon,
    umbrella: UmbrellaIcon,
    // Nature
    banyanTree: BanyanTreeIcon,
    coconutTree: CoconutTreeIcon,
    lotus: LotusIcon,
    sunflower: SunflowerIcon,
    well: WellIcon,
    river: RiverIcon,
    field: FieldIcon,
    hill: HillIcon,
    // Cultural
    templeBell: TempleBellIcon,
    diya: DiyaIcon,
    rangoli: RangoliIcon,
    incense: IncenseIcon,
    flute: FluteIcon,
    drum: DrumIcon,
    prayerBeads: PrayerBeadsIcon,
    garland: GarlandIcon,
    // Tools
    sickle: SickleIcon,
    hammer: HammerIcon,
    plough: PloughIcon,
    fishingNet: FishingNetIcon,
    weavingLoom: WeavingLoomIcon,
    pottersWheel: PottersWheelIcon,
};

export type VmraIconKey = keyof typeof VMRA_ICON_MAP;
