import { useEffect, useState } from 'react';

export function ScientificBrainCanvas() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleMediaChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };
        mediaQuery.addEventListener('change', handleMediaChange);

        return () => {
            mediaQuery.removeEventListener('change', handleMediaChange);
        };
    }, []);

    return (
        <div className="relative w-full max-w-[680px] mx-auto flex items-center justify-center select-none overflow-visible py-0 sm:py-4">
            {/* Subtle diffuse ambient glow — blends with the site's light blue/sage palette */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div
                    className="rounded-full blur-3xl"
                    style={{
                        width: '85%',
                        height: '90%',
                        background: 'radial-gradient(ellipse at 50% 55%, rgba(143,175,139,0.22) 0%, rgba(79,124,120,0.14) 40%, rgba(154,192,218,0.18) 70%, transparent 100%)',
                        opacity: 0.85,
                    }}
                />
            </div>

            {/* Transparent Brain Image — no background, no border, no card */}
            <div className="relative z-10 w-full flex items-center justify-center">
                <img
                    src="/images/transparent-hero-brain.png?v=2"
                    alt="VyomFlow Cognitive Brain Visualization"
                    className="w-full h-auto max-w-[380px] sm:max-w-[460px] md:max-w-[540px] object-contain block"
                    style={{
                        filter: 'drop-shadow(0 8px 32px rgba(79,124,120,0.18)) drop-shadow(0 2px 8px rgba(154,192,218,0.15))',
                        transition: 'transform 0.7s ease-out',
                    }}
                    loading="eager"
                    onError={e => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes('/images/hero-brain-visual.png')) {
                            target.src = '/images/hero-brain-visual.png?v=2';
                        }
                    }}
                    onMouseEnter={e => { if (!prefersReducedMotion) (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.012)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                />

                {/* Subtle pulsing neural nodes — teal/gold matching existing VyomFlow palette */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-20"
                    viewBox="0 0 1024 682"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <defs>
                        <filter id="brainNodeGlow" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    <g filter="url(#brainNodeGlow)">
                        {/* Central warm gold synaptic burst */}
                        <circle
                            cx="530"
                            cy="310"
                            r="6"
                            fill="#FDEFC0"
                            className={prefersReducedMotion ? '' : 'animate-ping'}
                            style={{ opacity: 0.75, animationDuration: '2.6s' }}
                        />
                        <circle cx="530" cy="310" r="4" fill="#D8B878" />

                        {/* Frontal lobe left */}
                        <circle
                            cx="295"
                            cy="210"
                            r="4.5"
                            fill="#DCF0E8"
                            className={prefersReducedMotion ? '' : 'animate-ping'}
                            style={{ opacity: 0.65, animationDuration: '3.8s', animationDelay: '0.7s' }}
                        />
                        <circle cx="295" cy="210" r="3" fill="#8FAF8B" />

                        {/* Parietal top-center */}
                        <circle
                            cx="460"
                            cy="140"
                            r="4"
                            fill="#DCF0E8"
                            className={prefersReducedMotion ? '' : 'animate-ping'}
                            style={{ opacity: 0.6, animationDuration: '4.4s', animationDelay: '1.2s' }}
                        />
                        <circle cx="460" cy="140" r="2.5" fill="#8FAF8B" />

                        {/* Right posterior */}
                        <circle
                            cx="760"
                            cy="240"
                            r="4.5"
                            fill="#C8E4F4"
                            className={prefersReducedMotion ? '' : 'animate-ping'}
                            style={{ opacity: 0.6, animationDuration: '3.2s', animationDelay: '0.4s' }}
                        />
                        <circle cx="760" cy="240" r="3" fill="#4F7C78" />

                        {/* Temporal lower */}
                        <circle
                            cx="430"
                            cy="420"
                            r="4.5"
                            fill="#FDEFC0"
                            className={prefersReducedMotion ? '' : 'animate-pulse'}
                            style={{ opacity: 0.55, animationDuration: '2.4s' }}
                        />
                        <circle cx="430" cy="420" r="3" fill="#D8B878" />

                        {/* Right top */}
                        <circle
                            cx="680"
                            cy="155"
                            r="4"
                            fill="#C8E4F4"
                            className={prefersReducedMotion ? '' : 'animate-ping'}
                            style={{ opacity: 0.55, animationDuration: '4.0s', animationDelay: '1.5s' }}
                        />
                        <circle cx="680" cy="155" r="2.5" fill="#4F7C78" />
                    </g>
                </svg>
            </div>
        </div>
    );
}
