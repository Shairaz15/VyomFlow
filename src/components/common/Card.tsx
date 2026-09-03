import React, { useCallback, useRef } from "react";
import "./Card.css";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    onClick?: (e?: any) => void;
    floating?: boolean;
    /** Accessible label for the card when used as a button (e.g. for screen readers) */
    ariaLabel?: string;
}

export function Card({ children, className = "", onClick, floating = false, ariaLabel, onMouseMove, onKeyDown, role, tabIndex, ...rest }: CardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Spotlight border effect - track mouse position
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (onMouseMove) onMouseMove(e);
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--spotlight-x', `${x}px`);
        cardRef.current.style.setProperty('--spotlight-y', `${y}px`);
    }, [onMouseMove]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onKeyDown) onKeyDown(e);
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    }, [onClick, onKeyDown]);

    return (
        <div
            ref={cardRef}
            className={`glass-card ${floating ? 'floating' : ''} ${className}`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onKeyDown={handleKeyDown}
            role={role ?? (onClick ? "button" : undefined)}
            tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
            aria-label={ariaLabel}
            {...rest}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
}

export function CardHeader({ title, subtitle }: CardHeaderProps) {
    return (
        <div className="card-header">
            <h3 className="card-title">{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
    );
}

interface CardContentProps {
    children: React.ReactNode;
}

export function CardContent({ children }: CardContentProps) {
    return <div className="card-content">{children}</div>;
}
