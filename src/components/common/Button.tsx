import React, { useCallback, useRef } from "react";
import "./Button.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    type?: "button" | "submit" | "reset";
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    onClick,
    type = "button",
    onMouseMove,
    onMouseLeave,
    ...rest
}: ButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Magnetic hover effect - button moves slightly toward cursor
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (onMouseMove) onMouseMove(e);
        if (disabled || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate offset (subtle magnetic pull)
        const deltaX = (e.clientX - centerX) * 0.1;
        const deltaY = (e.clientY - centerY) * 0.15;

        buttonRef.current.style.setProperty('--mx', `${deltaX}px`);
        buttonRef.current.style.setProperty('--my', `${deltaY}px`);
    }, [disabled, onMouseMove]);

    const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (onMouseLeave) onMouseLeave(e);
        if (buttonRef.current) {
            buttonRef.current.style.setProperty('--mx', '0px');
            buttonRef.current.style.setProperty('--my', '0px');
        }
    }, [onMouseLeave]);

    return (
        <button
            ref={buttonRef}
            type={type}
            className={`btn btn-${variant} btn-${size} ${className}`}
            disabled={disabled}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            {...rest}
        >
            {children}
        </button>
    );
}
