import React from 'react';
import './NeuralFlowBrandVisual.css';

interface NeuralFlowBrandVisualProps {
    className?: string;
}

export const NeuralFlowBrandVisual: React.FC<NeuralFlowBrandVisualProps> = ({ className = '' }) => {
    return (
        <div className={`neural-flow-brand-container ${className}`} role="img" aria-label="VyomFlow Neural Flow Signature">
            {/* Ambient Radial Cognitive Aura */}
            <div className="neural-flow-ambient-glow" aria-hidden="true" />

            {/* Neural Network SVG Artwork */}
            <div className="neural-flow-svg-wrapper">
                <svg
                    className="neural-flow-svg"
                    viewBox="0 0 600 220"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Soft Brand Gradients */}
                        <linearGradient id="neuralTealSage" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4F7C78" stopOpacity="0.85" />
                            <stop offset="50%" stopColor="#8FAF8B" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#D8B878" stopOpacity="0.8" />
                        </linearGradient>

                        <linearGradient id="neuralLeftHemisphere" x1="0%" y1="0%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor="#8FAF8B" stopOpacity="0.6" />
                            <stop offset="60%" stopColor="#4F7C78" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#D8E7F7" stopOpacity="0.4" />
                        </linearGradient>

                        <linearGradient id="neuralRightHemisphere" x1="100%" y1="0%" x2="0%" y2="50%">
                            <stop offset="0%" stopColor="#8FAF8B" stopOpacity="0.6" />
                            <stop offset="60%" stopColor="#4F7C78" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#D8E7F7" stopOpacity="0.4" />
                        </linearGradient>

                        <linearGradient id="neuralBridge" x1="0%" y1="50%" x2="100%" y2="50%">
                            <stop offset="0%" stopColor="#4F7C78" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#D8B878" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#4F7C78" stopOpacity="0.4" />
                        </linearGradient>

                        {/* Central Node Golden Halo */}
                        <radialGradient id="centerNodeGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#D8B878" stopOpacity="0.9" />
                            <stop offset="40%" stopColor="#D8B878" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#D8B878" stopOpacity="0" />
                        </radialGradient>

                        {/* Subtle Node Aura */}
                        <radialGradient id="nodeSoftAura" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#F7F4EC" stopOpacity="1" />
                            <stop offset="60%" stopColor="#8FAF8B" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#4F7C78" stopOpacity="0" />
                        </radialGradient>

                        {/* Neural Pathway Curves for Subtle Traveling Light Animations */}
                        <path
                            id="travelPathAlpha"
                            d="M 120 120 C 140 65, 200 45, 250 50 C 280 55, 290 85, 300 110 C 310 135, 360 160, 420 155 C 470 150, 490 115, 480 110"
                        />
                        <path
                            id="travelPathBeta"
                            d="M 480 110 C 460 55, 400 40, 350 45 C 320 50, 310 85, 300 110 C 290 135, 230 165, 180 160 C 130 155, 110 125, 120 120"
                        />
                    </defs>

                    {/* =========================================================
                        1. BACKGROUND FAINT CONNECTIVE MESH (Quiet negative space)
                       ========================================================= */}
                    <g className="neural-mesh-faint" opacity="0.35">
                        <path d="M 120 120 Q 210 90 300 110" stroke="#8FAF8B" strokeWidth="0.75" strokeDasharray="3 3" />
                        <path d="M 480 110 Q 390 90 300 110" stroke="#8FAF8B" strokeWidth="0.75" strokeDasharray="3 3" />
                        <path d="M 210 45 Q 300 70 390 45" stroke="#4F7C78" strokeWidth="0.75" strokeDasharray="4 4" />
                        <path d="M 170 170 Q 300 150 430 170" stroke="#4F7C78" strokeWidth="0.75" strokeDasharray="4 4" />
                        <path d="M 250 50 Q 230 115 250 175" stroke="#8FAF8B" strokeWidth="0.75" strokeDasharray="2 3" />
                        <path d="M 350 50 Q 370 115 350 175" stroke="#8FAF8B" strokeWidth="0.75" strokeDasharray="2 3" />
                    </g>

                    {/* =========================================================
                        2. MAIN ORGANIC NEURAL PATHWAYS (Brain-inspired contours)
                       ========================================================= */}
                    {/* Left Hemisphere Outer Flow Arc */}
                    <path
                        d="M 290 38 C 220 32, 135 60, 115 115 C 98 160, 140 195, 210 190 C 255 185, 280 165, 292 145"
                        stroke="url(#neuralLeftHemisphere)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />

                    {/* Right Hemisphere Outer Flow Arc */}
                    <path
                        d="M 310 38 C 380 32, 465 60, 485 115 C 502 160, 460 195, 390 190 C 345 185, 320 165, 308 145"
                        stroke="url(#neuralRightHemisphere)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />

                    {/* Left Inner Frontal & Parietal Wave */}
                    <path
                        d="M 210 45 C 160 70, 145 110, 175 145 C 205 180, 260 175, 300 110"
                        stroke="url(#neuralTealSage)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />

                    {/* Right Inner Frontal & Parietal Wave */}
                    <path
                        d="M 390 45 C 440 70, 455 110, 425 145 C 395 180, 340 175, 300 110"
                        stroke="url(#neuralTealSage)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />

                    {/* Corpus Callosum Inter-Hemispheric Bridge */}
                    <path
                        d="M 180 110 C 230 85, 370 85, 420 110"
                        stroke="url(#neuralBridge)"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    {/* Longitudinal Observation Ribbon (Horizontal Flow) */}
                    <path
                        d="M 75 125 C 150 145, 230 100, 300 110 C 370 120, 450 75, 525 95"
                        stroke="url(#neuralTealSage)"
                        strokeWidth="1.2"
                        strokeDasharray="6 4"
                        strokeOpacity="0.75"
                        strokeLinecap="round"
                    />

                    {/* Subtle Cross-Synaptic Tendrils */}
                    <path d="M 210 45 Q 290 50 300 110" stroke="#8FAF8B" strokeWidth="1.2" strokeOpacity="0.6" strokeLinecap="round" />
                    <path d="M 390 45 Q 310 50 300 110" stroke="#8FAF8B" strokeWidth="1.2" strokeOpacity="0.6" strokeLinecap="round" />
                    <path d="M 175 145 Q 240 125 300 110" stroke="#4F7C78" strokeWidth="1.3" strokeOpacity="0.7" strokeLinecap="round" />
                    <path d="M 425 145 Q 360 125 300 110" stroke="#4F7C78" strokeWidth="1.3" strokeOpacity="0.7" strokeLinecap="round" />
                    <path d="M 250 185 Q 280 150 300 110" stroke="#8FAF8B" strokeWidth="1.1" strokeOpacity="0.5" strokeLinecap="round" />
                    <path d="M 350 185 Q 320 150 300 110" stroke="#8FAF8B" strokeWidth="1.1" strokeOpacity="0.5" strokeLinecap="round" />

                    {/* =========================================================
                        3. SYNAPTIC NODES (Varying tactile sizes & soft glow)
                       ========================================================= */}
                    {/* Peripheral Satellite Nodes (Tiny) */}
                    <circle cx="115" cy="115" r="3" fill="#8FAF8B" opacity="0.8" />
                    <circle cx="485" cy="115" r="3" fill="#8FAF8B" opacity="0.8" />
                    <circle cx="210" cy="45" r="3.5" fill="#D8E7F7" opacity="0.85" />
                    <circle cx="390" cy="45" r="3.5" fill="#D8E7F7" opacity="0.85" />
                    <circle cx="290" cy="38" r="2.5" fill="#F7F4EC" opacity="0.9" />
                    <circle cx="310" cy="38" r="2.5" fill="#F7F4EC" opacity="0.9" />
                    <circle cx="175" cy="145" r="3.2" fill="#8FAF8B" opacity="0.85" />
                    <circle cx="425" cy="145" r="3.2" fill="#8FAF8B" opacity="0.85" />
                    <circle cx="210" cy="190" r="3" fill="#4F7C78" opacity="0.8" />
                    <circle cx="390" cy="190" r="3" fill="#4F7C78" opacity="0.8" />
                    <circle cx="75" cy="125" r="2.2" fill="#D8B878" opacity="0.75" />
                    <circle cx="525" cy="95" r="2.2" fill="#D8B878" opacity="0.75" />

                    {/* Secondary Intermediary Cognitive Nodes (Medium) */}
                    <circle cx="180" cy="110" r="4" fill="#F7F4EC" />
                    <circle cx="180" cy="110" r="2" fill="#4F7C78" />
                    <circle cx="420" cy="110" r="4" fill="#F7F4EC" />
                    <circle cx="420" cy="110" r="2" fill="#4F7C78" />

                    <circle cx="250" cy="185" r="3.5" fill="#F7F4EC" opacity="0.9" />
                    <circle cx="350" cy="185" r="3.5" fill="#F7F4EC" opacity="0.9" />

                    {/* Small Gold Cognitive Activity Sparkles */}
                    <circle cx="230" cy="80" r="1.8" fill="#D8B878" opacity="0.9" />
                    <circle cx="370" cy="80" r="1.8" fill="#D8B878" opacity="0.9" />
                    <circle cx="270" cy="150" r="2" fill="#D8B878" opacity="0.85" />
                    <circle cx="330" cy="150" r="2" fill="#D8B878" opacity="0.85" />

                    {/* =========================================================
                        4. CENTRAL COGNITIVE NODE (Subtle gold glow & focal core)
                       ========================================================= */}
                    {/* Golden Radial Halo */}
                    <circle cx="300" cy="110" r="24" fill="url(#centerNodeGlow)" className="neural-center-halo" />
                    
                    {/* Outer Ring */}
                    <circle cx="300" cy="110" r="7.5" fill="#17324D" stroke="#D8B878" strokeWidth="1.5" />
                    
                    {/* Inner Core */}
                    <circle cx="300" cy="110" r="4" fill="#F7F4EC" />
                    <circle cx="300" cy="110" r="2" fill="#D8B878" />

                    {/* =========================================================
                        5. SUBTLE SLOW TRAVELING LIGHT PULSE (8-14s Journey)
                       ========================================================= */}
                    {/* Traveling Pulse Alpha */}
                    <circle r="2.8" fill="#F7F4EC" className="traveling-neural-light light-alpha">
                        <animateMotion
                            dur="12s"
                            repeatCount="indefinite"
                            rotate="auto"
                        >
                            <mpath href="#travelPathAlpha" />
                        </animateMotion>
                    </circle>
                    <circle r="6" fill="#D8B878" opacity="0.4" className="traveling-neural-light light-alpha-glow">
                        <animateMotion
                            dur="12s"
                            repeatCount="indefinite"
                            rotate="auto"
                        >
                            <mpath href="#travelPathAlpha" />
                        </animateMotion>
                    </circle>

                    {/* Traveling Pulse Beta (Offset start & path) */}
                    <circle r="2.4" fill="#D8B878" className="traveling-neural-light light-beta">
                        <animateMotion
                            dur="14s"
                            begin="4s"
                            repeatCount="indefinite"
                            rotate="auto"
                        >
                            <mpath href="#travelPathBeta" />
                        </animateMotion>
                    </circle>
                </svg>
            </div>

            {/* VyomFlow Wordmark & Signature Tagline */}
            <div className="neural-flow-brand-text">
                <span className="neural-flow-wordmark">VyomFlow</span>
                <span className="neural-flow-tagline">Every Mind Has a Story.</span>
            </div>
        </div>
    );
};
