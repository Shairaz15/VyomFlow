import React from "react";
import { SpecularButton } from "./SpecularButton";
import { useTheme } from "../../contexts/ThemeContext";
import "./Button.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    type?: "button" | "submit" | "reset";
    radius?: number;
    tint?: string;
    tintOpacity?: number;
    blur?: number;
    textColor?: string;
    lineColor?: string;
    baseColor?: string;
    intensity?: number;
    shineSize?: number;
    shineFade?: number;
    thickness?: number;
    speed?: number;
    followMouse?: boolean;
    proximity?: number;
    autoAnimate?: boolean;
    style?: React.CSSProperties;
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    onClick,
    type = "button",
    radius,
    tint,
    tintOpacity,
    blur = 0,
    textColor,
    lineColor,
    baseColor,
    intensity,
    shineSize,
    shineFade,
    thickness,
    speed,
    followMouse = true,
    proximity,
    autoAnimate,
    style,
    ...rest
}: ButtonProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // VyomFlow adaptive specular presets
    let effectiveTint = tint;
    let effectiveTintOpacity = tintOpacity;
    let effectiveLineColor = lineColor;
    let effectiveBaseColor = baseColor;
    let effectiveTextColor = textColor;
    let effectiveIntensity = intensity;
    let effectiveAutoAnimate = autoAnimate;
    let effectiveRadius = radius ?? (size === "sm" ? 12 : size === "lg" ? 18 : 14);

    if (variant === "primary") {
        effectiveTint = tint ?? (isDark ? "#142838" : "#4F7C78");
        effectiveTintOpacity = tintOpacity ?? (isDark ? 0.94 : 0.96);
        effectiveLineColor = lineColor ?? "#5EEAD4"; // VyomFlow signature cyan-teal
        effectiveBaseColor = baseColor ?? (isDark ? "#1e293b" : "#2c4f4d");
        effectiveTextColor = textColor ?? "#FFFFFF";
        effectiveIntensity = intensity ?? 1.25;
        effectiveAutoAnimate = autoAnimate ?? true;
    } else if (variant === "secondary") {
        effectiveTint = tint ?? (isDark ? "#1E293B" : "#E2E8F0");
        effectiveTintOpacity = tintOpacity ?? (isDark ? 0.88 : 0.92);
        effectiveLineColor = lineColor ?? (isDark ? "#38bdf8" : "#0284c7");
        effectiveBaseColor = baseColor ?? (isDark ? "#0f172a" : "#cbd5e1");
        effectiveTextColor = textColor ?? (isDark ? "#F8FAFC" : "#17324D");
        effectiveIntensity = intensity ?? 0.95;
        effectiveAutoAnimate = autoAnimate ?? false;
    } else if (variant === "ghost") {
        effectiveTint = tint ?? "transparent";
        effectiveTintOpacity = tintOpacity ?? 0;
        effectiveLineColor = lineColor ?? (isDark ? "#5EEAD4" : "#4F7C78");
        effectiveBaseColor = baseColor ?? "transparent";
        effectiveTextColor = textColor ?? (isDark ? "#5EEAD4" : "#4F7C78");
        effectiveIntensity = intensity ?? 0.8;
        effectiveAutoAnimate = autoAnimate ?? false;
    }

    return (
        <SpecularButton
            size={size}
            radius={effectiveRadius}
            tint={effectiveTint}
            tintOpacity={effectiveTintOpacity}
            blur={blur}
            textColor={effectiveTextColor}
            lineColor={effectiveLineColor}
            baseColor={effectiveBaseColor}
            intensity={effectiveIntensity}
            shineSize={shineSize}
            shineFade={shineFade}
            thickness={thickness}
            speed={speed}
            followMouse={followMouse}
            proximity={proximity}
            autoAnimate={effectiveAutoAnimate}
            disabled={disabled}
            onClick={onClick}
            type={type}
            className={`btn btn-${variant} btn-${size} ${className}`}
            style={style}
            {...rest}
        >
            {children}
        </SpecularButton>
    );
}
