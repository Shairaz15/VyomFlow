import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { VerifiedLanguageSwitcher } from "../components/common/VerifiedLanguageSwitcher";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { ScientificBrainCanvas } from "../components/landing/ScientificBrainCanvas";
import { VyomFlowVideoBrand } from "../components/landing/VyomFlowVideoBrand";
import "./VyomFlowLanding.css";

export function Landing() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleBeginJourney = () => {
        navigate("/tests");
    };

    const handleScrollTo = (id: string) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="vyom-sarvam-landing flex flex-col min-h-screen selection:bg-[#4F7C78]/20 selection:text-[#17324D]">
            {/* =========================================================================
               2 & 3. FLOATING STICKY NAVBAR (Pill Shaped Container)
               ========================================================================= */}
            {/* Top Translucent Blur Bar Mask (Obscures content scrolling up above/behind navbar) */}
            <div className="vyom-top-blur-mask" aria-hidden="true" />

            <div className="vyom-navbar-fixed-container">
                <header className="vyom-floating-navbar flex items-center justify-between gap-4">
                    {/* Brand Logo & Name */}
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-full bg-[#4F7C78]/10 flex items-center justify-center text-[#4F7C78]">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10m0 0C10.5 7.5 7 6 4 7c0 4 2.5 7.5 8 9m0-6c1.5-2.5 5-4 8-3 0 4-2.5 7.5-8 9" />
                            </svg>
                        </div>
                        <span className="vyom-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#17324D]">
                            VyomFlow
                        </span>
                    </div>

                    {/* Desktop Center Navigation Links */}
                    <nav className="hidden md:flex items-center gap-6">
                        <button onClick={() => handleScrollTo("how-it-works")} className="vyom-nav-link">
                            {t("landing.howItWorks") || "HOW IT WORKS"}
                        </button>
                        <button onClick={() => handleScrollTo("platform")} className="vyom-nav-link">
                            PLATFORM
                        </button>
                        <button onClick={() => handleScrollTo("privacy")} className="vyom-nav-link">
                            PRIVACY
                        </button>
                        <button onClick={() => handleScrollTo("about")} className="vyom-nav-link">
                            ABOUT
                        </button>
                    </nav>

                    {/* Right Action Controls */}
                    <div className="hidden sm:flex items-center gap-2.5">
                        <VerifiedLanguageSwitcher />
                        <ThemeToggle />
                        <button
                            onClick={handleBeginJourney}
                            className="vyom-pill-btn-dark !py-2 !px-4 text-xs"
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => navigate("/login")}
                            className="vyom-pill-btn-light !py-2 !px-4 text-xs"
                        >
                            Contact Us
                        </button>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="flex items-center gap-2 sm:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle navigation menu"
                            className="p-2 text-[#17324D] rounded-full hover:bg-[#4F7C78]/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Mobile Dropdown Drawer */}
                {mobileMenuOpen && (
                    <div className="pointer-events-auto absolute top-16 left-4 right-4 bg-[#F7F4EC] border border-[#17324D]/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-center sm:hidden animate-fadeIn">
                        <button onClick={() => handleScrollTo("how-it-works")} className="vyom-nav-link text-left py-1">
                            HOW IT WORKS
                        </button>
                        <button onClick={() => handleScrollTo("platform")} className="vyom-nav-link text-left py-1">
                            PLATFORM
                        </button>
                        <button onClick={() => handleScrollTo("privacy")} className="vyom-nav-link text-left py-1">
                            PRIVACY
                        </button>
                        <button onClick={() => handleScrollTo("about")} className="vyom-nav-link text-left py-1">
                            ABOUT
                        </button>
                        <div className="pt-2 border-t border-[#17324D]/10 flex items-center justify-between">
                            <VerifiedLanguageSwitcher />
                            <div className="flex gap-2">
                                <button onClick={handleBeginJourney} className="vyom-pill-btn-dark !py-1.5 !px-3 text-xs">
                                    Sign Up
                                </button>
                                <button onClick={() => navigate("/login")} className="vyom-pill-btn-light !py-1.5 !px-3 text-xs">
                                    Contact Us
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <main className="flex-1 w-full flex flex-col items-center">
                {/* =========================================================================
                   4. HERO SECTION (Spacious, Centered, Clean Minimal Layout)
                   ========================================================================= */}
                <section className="vyom-hero-section w-full flex flex-col items-center justify-between text-center px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto flex flex-col items-center justify-between flex-1 py-4 w-full h-full">
                        {/* Hero Text Block */}
                        <div className="flex flex-col items-center my-auto pt-6">
                            {/* 5. HERO EYEBROW */}
                            <div className="vyom-hero-eyebrow mb-6">
                                <span>AI-FIRST COGNITIVE HEALTH PLATFORM</span>
                            </div>

                            {/* 6. HERO HEADLINE — ELEGANT SERIF TWO-TONE */}
                            <h1 className="vyom-hero-title mb-7">
                                <span className="vyom-title-navy">Understand</span>{" "}
                                <span className="vyom-title-teal">your mind.</span>
                                <br />
                                <span className="vyom-title-navy">Journey with</span>{" "}
                                <span className="vyom-title-teal">confidence.</span>
                            </h1>

                            {/* 7. HERO DESCRIPTION */}
                            <p className="vyom-hero-sub mb-14 sm:mb-20 max-w-2xl mx-auto">
                                VyomFlow helps you track cognitive performance over time through engaging activities, powered by AI.
                            </p>
                        </div>

                        {/* 8. HERO BUTTONS AT BOTTOM OF FOLD */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pb-4 mt-auto">
                            <button
                                onClick={handleBeginJourney}
                                className="vyom-pill-btn-dark w-full sm:w-auto"
                            >
                                <span>Begin Your Journey</span>
                                <span className="text-lg leading-none">→</span>
                            </button>
                            <button
                                onClick={() => handleScrollTo("how-it-works")}
                                className="vyom-pill-btn-light w-full sm:w-auto"
                            >
                                Learn How It Works
                            </button>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                   12. INSTITUTIONAL BRAND TICKER MARQUEE (NIMHANS, AIIMS, Stanford, etc.)
                   ========================================================================= */}
                <div className="vyom-ticker-wrapper">
                    <div className="text-center text-xs font-bold text-[#4F7C78] tracking-[0.2em] uppercase mb-6 pb-2 px-4">
                        — TRUSTED BY RESEARCHERS & LEADING INSTITUTIONS —
                    </div>
                    <div className="vyom-ticker-track">
                        <span className="vyom-ticker-item">NIMHANS</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">AIIMS</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">STANFORD NEUROSCIENCE</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">HARVARD MEDICAL SCHOOL</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">JOHNS HOPKINS MEDICINE</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">OXFORD COGNITIVE LAB</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">NATIONAL INSTITUTE OF HEALTH</span>
                        <span className="vyom-ticker-dot">•</span>
                        {/* Duplicate for infinite seamless marquee loop */}
                        <span className="vyom-ticker-item">NIMHANS</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">AIIMS</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">STANFORD NEUROSCIENCE</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">HARVARD MEDICAL SCHOOL</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">JOHNS HOPKINS MEDICINE</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">OXFORD COGNITIVE LAB</span>
                        <span className="vyom-ticker-dot">•</span>
                        <span className="vyom-ticker-item">NATIONAL INSTITUTE OF HEALTH</span>
                    </div>
                </div>

                {/* =========================================================================
                   13. SECTION AFTER HERO — HOW VYOMFLOW WORKS (True Orbital System)
                   ========================================================================= */}
                <section id="how-it-works" className="vyom-section scroll-mt-24 py-16 flex flex-col items-center justify-center">
                    {/* Section Header with generous bottom padding so top circle never overlaps */}
                    <div className="text-center mb-16 sm:mb-20">
                        <h2 className="vyom-serif vyom-heading-dark text-3xl sm:text-4xl mb-3">
                            How VyomFlow Works
                        </h2>
                        <p className="text-sm sm:text-base vyom-sub-dark max-w-lg mx-auto text-center leading-relaxed">
                            Three simple steps for meaningful cognitive tracking over time.
                        </p>
                    </div>

                    {/* DESKTOP TRUE ORBITAL SYSTEM */}
                    <div className="hidden md:block relative w-full max-w-[720px] mx-auto min-h-[680px]">
                        <div className="vyom-orbit-stage">
                            {/* 1. MATHEMATICALLY CENTERED FIXED VYOMFLOW CORE NODE */}
                            <div className="vyom-central-core">
                                <div className="w-8 h-8 rounded-full bg-[#4F7C78]/15 text-[#4F7C78] flex items-center justify-center mb-1">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10m0 0C10.5 7.5 7 6 4 7c0 4 2.5 7.5 8 9m0-6c1.5-2.5 5-4 8-3 0 4-2.5 7.5-8 9" />
                                    </svg>
                                </div>
                                <div className="vyom-serif text-lg font-bold text-[#17324D] tracking-tight leading-tight">
                                    VyomFlow
                                </div>
                                <div className="text-[10px] font-bold text-[#4F7C78] tracking-widest uppercase mt-0.5">
                                    Cognitive Flow
                                </div>
                            </div>

                            {/* 2. SVG PERFECT DASHED ORBIT CIRCLE */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-5" viewBox="0 0 680 680" fill="none">
                                <circle cx="340" cy="340" r="280" stroke="#8FAF8B" strokeWidth="2" strokeDasharray="6 6" strokeOpacity="0.38" />
                                <circle cx="340" cy="340" r="145" stroke="#4F7C78" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2" />
                            </svg>

                            {/* 3. REVOLVING ORBIT RING CONTAINER (22s Rotation) */}
                            <div className="vyom-orbit-ring">
                                {/* STEP 01: PLAY (At 12 o'clock / 0°) */}
                                <div className="vyom-orbit-node vyom-orbit-node-play">
                                    <div className="vyom-orbit-counter-rotate">
                                        <div className="w-8 h-8 rounded-full bg-[#8FAF8B]/15 text-[#4F7C78] flex items-center justify-center mb-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="vyom-loop-number text-[#8FAF8B]">01</div>
                                        <div className="vyom-loop-title">PLAY</div>
                                        <p className="vyom-loop-desc">
                                            Complete short cognitive activities designed to engage performance.
                                        </p>
                                    </div>
                                </div>

                                {/* STEP 02: TRACK (At 4 o'clock / 120°) */}
                                <div className="vyom-orbit-node vyom-orbit-node-track">
                                    <div className="vyom-orbit-counter-rotate">
                                        <div className="w-8 h-8 rounded-full bg-[#4F7C78]/15 text-[#4F7C78] flex items-center justify-center mb-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                            </svg>
                                        </div>
                                        <div className="vyom-loop-number text-[#4F7C78]">02</div>
                                        <div className="vyom-loop-title">TRACK</div>
                                        <p className="vyom-loop-desc">
                                            Build a picture of your cognitive performance over time.
                                        </p>
                                    </div>
                                </div>

                                {/* STEP 03: UNDERSTAND (At 8 o'clock / 240°) */}
                                <div className="vyom-orbit-node vyom-orbit-node-understand">
                                    <div className="vyom-orbit-counter-rotate">
                                        <div className="w-8 h-8 rounded-full bg-[#D8B878]/20 text-[#D8B878] flex items-center justify-center mb-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <div className="vyom-loop-number text-[#D8B878]">03</div>
                                        <div className="vyom-loop-title">UNDERSTAND</div>
                                        <p className="vyom-loop-desc">
                                            See meaningful patterns and build awareness of your journey.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE VERTICAL COGNITIVE FLOW */}
                    <div className="md:hidden flex flex-col items-center gap-6 py-4">
                        {/* Central Core Mobile Badge */}
                        <div className="w-28 h-28 rounded-full bg-[#F7F4EC] border border-[#4F7C78]/30 flex flex-col items-center justify-center text-center shadow-md mb-2">
                            <div className="vyom-serif font-bold text-[#17324D] text-base">VyomFlow</div>
                            <div className="text-[9px] text-[#4F7C78] uppercase font-bold tracking-widest">Cognitive Core</div>
                        </div>

                        {/* Mobile Step 01 */}
                        <div className="vyom-orbit-node !static !w-[220px] !h-[220px] border-1.5 border-[#8FAF8B]/50">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-8 h-8 rounded-full bg-[#8FAF8B]/15 text-[#4F7C78] flex items-center justify-center mb-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="vyom-loop-number text-[#8FAF8B]">01</div>
                                <div className="vyom-loop-title">PLAY</div>
                                <p className="vyom-loop-desc">
                                    Complete short cognitive activities designed to engage performance.
                                </p>
                            </div>
                        </div>

                        <div className="w-0.5 h-6 bg-[#4F7C78]/30" />

                        {/* Mobile Step 02 */}
                        <div className="vyom-orbit-node !static !w-[220px] !h-[220px] border-1.5 border-[#4F7C78]/50">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-8 h-8 rounded-full bg-[#4F7C78]/15 text-[#4F7C78] flex items-center justify-center mb-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                    </svg>
                                </div>
                                <div className="vyom-loop-number text-[#4F7C78]">02</div>
                                <div className="vyom-loop-title">TRACK</div>
                                <p className="vyom-loop-desc">
                                    Build a picture of your cognitive performance over time.
                                </p>
                            </div>
                        </div>

                        <div className="w-0.5 h-6 bg-[#4F7C78]/30" />

                        {/* Mobile Step 03 */}
                        <div className="vyom-orbit-node !static !w-[220px] !h-[220px] border-1.5 border-[#D8B878]/50">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-8 h-8 rounded-full bg-[#D8B878]/20 text-[#D8B878] flex items-center justify-center mb-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div className="vyom-loop-number text-[#D8B878]">03</div>
                                <div className="vyom-loop-title">UNDERSTAND</div>
                                <p className="vyom-loop-desc">
                                    See meaningful patterns and build awareness of your journey.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                   14. JOURNEY SECTION — YOUR COGNITIVE JOURNEY (Central Brain & Orbiting Games)
                   ========================================================================= */}
                <section id="platform" className="vyom-section scroll-mt-24 relative overflow-hidden py-8">
                    <div className="text-center mb-8 relative z-20">
                        <h2 className="vyom-serif vyom-heading-dark text-3xl sm:text-4xl mb-3">
                            Your Cognitive Journey
                        </h2>
                        <p className="text-sm sm:text-base vyom-sub-dark max-w-lg mx-auto text-center leading-relaxed">
                            Explore guided destinations crafted to observe key cognitive domains in an engaging, supportive environment.
                        </p>
                    </div>

                    {/* DESKTOP RADIAL ORBITAL MAP (Brain in center, 7 activities surrounding it) */}
                    <div className="hidden lg:block relative w-full max-w-[1240px] mx-auto min-h-[660px]">
                        {/* Connecting Neural Pathway Lines (SVG Overlay) */}
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-45"
                            viewBox="0 0 1240 660"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Curved pathway arcs from central brain (620, 330) outwards */}
                            <path d="M 620 280 C 620 200, 620 120, 620 70" stroke="#4F7C78" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 520 270 C 380 220, 260 180, 185 145" stroke="#8FAF8B" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 720 270 C 860 220, 980 180, 1055 145" stroke="#4F7C78" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 480 330 C 330 330, 230 350, 140 370" stroke="#8FAF8B" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 760 330 C 910 330, 1010 350, 1100 370" stroke="#D8B878" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 520 390 C 380 460, 310 520, 240 575" stroke="#4F7C78" strokeWidth="1.5" strokeDasharray="5 5" />
                            <path d="M 720 390 C 860 460, 930 520, 1000 575" stroke="#8FAF8B" strokeWidth="1.5" strokeDasharray="5 5" />
                        </svg>

                        {/* Central Brain Visualization Anchor */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[520px]">
                            <ScientificBrainCanvas />
                        </div>

                        {/* 1. Story Grove (Top Center) */}
                        <div
                            onClick={() => navigate("/activities/story-narration")}
                            className="vyom-orbital-card absolute top-[2%] left-1/2 -translate-x-1/2"
                        >
                            <div className="vyom-orbital-icon">🌳</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Story Grove</h4>
                                <p className="text-xs text-[#66757A]">Memory & Language</p>
                            </div>
                        </div>

                        {/* 2. Memory Garden (Top Left) */}
                        <div
                            onClick={() => navigate("/activities/spatial-memory")}
                            className="vyom-orbital-card absolute top-[16%] left-[4%]"
                        >
                            <div className="vyom-orbital-icon">🌷</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Memory Garden</h4>
                                <p className="text-xs text-[#66757A]">Visuospatial Memory</p>
                            </div>
                        </div>

                        {/* 3. Pattern Pond (Top Right) */}
                        <div
                            onClick={() => navigate("/activities/pattern-matrix")}
                            className="vyom-orbital-card absolute top-[16%] right-[4%]"
                        >
                            <div className="vyom-orbital-icon">🌊</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Pattern Pond</h4>
                                <p className="text-xs text-[#66757A]">Executive Function</p>
                            </div>
                        </div>

                        {/* 4. Focus Meadow (Mid Left) */}
                        <div
                            onClick={() => navigate("/activities/reaction-time")}
                            className="vyom-orbital-card absolute top-[50%] left-[1%]"
                        >
                            <div className="vyom-orbital-icon">🌾</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Focus Meadow</h4>
                                <p className="text-xs text-[#66757A]">Reaction Time</p>
                            </div>
                        </div>

                        {/* 5. Firefly Trail (Mid Right) */}
                        <div
                            onClick={() => navigate("/activities/visual-search")}
                            className="vyom-orbital-card absolute top-[50%] right-[1%]"
                        >
                            <div className="vyom-orbital-icon">✨</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Firefly Trail</h4>
                                <p className="text-xs text-[#66757A]">Sustained Attention</p>
                            </div>
                        </div>

                        {/* 6. Discovery Trail (Bottom Left) */}
                        <div
                            onClick={() => navigate("/activities/spatial-navigation")}
                            className="vyom-orbital-card absolute bottom-[4%] left-[12%]"
                        >
                            <div className="vyom-orbital-icon">🧭</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Discovery Trail</h4>
                                <p className="text-xs text-[#66757A]">Spatial Navigation</p>
                            </div>
                        </div>

                        {/* 7. Story Corner (Bottom Right) */}
                        <div
                            onClick={() => navigate("/activities/verbal-memory")}
                            className="vyom-orbital-card absolute bottom-[4%] right-[12%]"
                        >
                            <div className="vyom-orbital-icon">📖</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Story Corner</h4>
                                <p className="text-xs text-[#66757A]">N-Back & Verbal Memory</p>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE/TABLET VERTICAL FLOW (Brain at top, activities stacked vertically below) */}
                    <div className="lg:hidden flex flex-col items-center gap-6">
                        <div className="w-full max-w-[480px]">
                            <ScientificBrainCanvas />
                        </div>
                        <div className="w-full max-w-[540px] flex flex-col gap-3">
                            <div onClick={() => navigate("/activities/story-narration")} className="vyom-journey-pill">
                                <div className="vyom-journey-icon">🌳</div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#17324D]">Story Grove</h4>
                                    <p className="text-xs text-[#66757A]">Memory & Language Recall</p>
                                </div>
                            </div>
                            <div onClick={() => navigate("/activities/spatial-memory")} className="vyom-journey-pill">
                                <div className="vyom-journey-icon">🌷</div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#17324D]">Memory Garden</h4>
                                    <p className="text-xs text-[#66757A]">Visuospatial Pattern Memory</p>
                                </div>
                            </div>
                            <div onClick={() => navigate("/activities/pattern-matrix")} className="vyom-journey-pill">
                                <div className="vyom-journey-icon">🌊</div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#17324D]">Pattern Pond</h4>
                                    <p className="text-xs text-[#66757A]">Executive Function & Matrix Logic</p>
                                </div>
                            </div>
                            <div onClick={() => navigate("/activities/reaction-time")} className="vyom-journey-pill">
                                <div className="vyom-journey-icon">🌾</div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#17324D]">Focus Meadow</h4>
                                    <p className="text-xs text-[#66757A]">Reaction Time & Inhibitory Control</p>
                                </div>
                            </div>
                            <div onClick={() => navigate("/activities/visual-search")} className="vyom-journey-pill">
                                <div className="vyom-journey-icon">✨</div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#17324D]">Firefly Trail</h4>
                                    <p className="text-xs text-[#66757A]">Sustained Visual Attention</p>
                                </div>
                            </div>
                            <div onClick={() => navigate("/activities/spatial-navigation")} className="vyom-journey-pill">
                                <div className="vyom-journey-icon">🧭</div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#17324D]">Discovery Trail</h4>
                                    <p className="text-xs text-[#66757A]">Spatial Navigation & Orientation</p>
                                </div>
                            </div>
                            <div onClick={() => navigate("/activities/verbal-memory")} className="vyom-journey-pill">
                                <div className="vyom-journey-icon">📖</div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[#17324D]">Story Corner</h4>
                                    <p className="text-xs text-[#66757A]">N-Back & Verbal Working Memory</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                   15. PRIVACY SECTION — REDESIGNED EDITORIAL IVORY PANEL OVER SOFT BLUE GRADIENT
                   ========================================================================= */}
                <section id="privacy" className="vyom-privacy-section scroll-mt-24">
                    <div className="vyom-privacy-panel">
                        {/* Centered Heading & Subtitle */}
                        <div className="text-center max-w-2xl mx-auto">
                            <h2 className="vyom-serif vyom-heading-dark text-3xl sm:text-4xl mb-3">
                                Your mind. Your data.
                            </h2>
                            <p className="text-sm sm:text-base vyom-sub-dark leading-relaxed">
                                Privacy is fundamentally embedded into the design and architecture of VyomFlow.
                            </p>

                            {/* Subtle Decorative Line Divider */}
                            <div className="vyom-privacy-divider" aria-hidden="true">
                                <span className="w-12 h-[1px] bg-[#4F7C78]/30" />
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4F7C78]" />
                                <span className="w-12 h-[1px] bg-[#4F7C78]/30" />
                            </div>
                        </div>

                        {/* 3 Horizontally Arranged Principles (Soft Tinted Individual Boxes: Sage -> Blue -> Gold) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {/* Principle 01: Private by Design (Soft Sage Tint: #EAF3EF, Accent: #4F7C78) */}
                            <div className="vyom-privacy-card vyom-privacy-card-sage">
                                <div className="vyom-privacy-icon-box">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3>Private by Design</h3>
                                <p>
                                    Cognitive metrics and ML feature extraction run locally in your browser session whenever possible, reducing unnecessary data exposure.
                                </p>
                            </div>

                            {/* Principle 02: You Own Your Data (Soft Muted Blue Tint: #EEF3F8, Accent: #4A6680) */}
                            <div className="vyom-privacy-card vyom-privacy-card-blue">
                                <div className="vyom-privacy-icon-box">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3>You Own Your Data</h3>
                                <p>
                                    Your assessment history and performance trends remain confidential and strictly under your control.
                                </p>
                            </div>

                            {/* Principle 03: Awareness, Not Diagnosis (Soft Warm Gold Tint: #F7F0E3, Accent: #A88752) */}
                            <div className="vyom-privacy-card vyom-privacy-card-gold">
                                <div className="vyom-privacy-icon-box">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3>Awareness, Not Diagnosis</h3>
                                <p>
                                    Designed for self-observation and long-term awareness, maintaining clear boundaries with medical diagnosis.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                           {/* =========================================================================
                   16. FINAL CTA SECTION (Sarvam Double-Frame Floating Card Replication)
                   ========================================================================= */}
                <section className="px-4 md:px-8 py-12 max-w-[1280px] mx-auto">
                    <div className="bg-white rounded-[40px] md:rounded-[64px] border border-black/5 p-3 md:p-4 shadow-xl">
                        <div 
                            className="relative flex flex-col justify-center items-center shadow-[0px_0px_0px_1px_rgba(0,0,0,0.05)] rounded-[28px] md:rounded-[52px] min-h-[450px] overflow-hidden" 
                            style={{ background: 'linear-gradient(to bottom, #13121e 0%, #a5bbfc 116.55%)' }}
                        >
                            {/* White Noise Texture Overlay */}
                            <div 
                                className="absolute inset-0 rotate-180 pointer-events-none mix-blend-soft-light" 
                                style={{
                                    backgroundImage: 'url(https://assets.sarvam.ai/tr:q-70,f-auto,dpr-auto/assets/misc/white-noise.webp)',
                                    backgroundSize: '512px 512px',
                                    backgroundPosition: 'top left',
                                    opacity: 0.5
                                }}
                            />

                            {/* Background SVG Arc Grid Hemisphere */}
                            <svg
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[820px] h-[280px] pointer-events-none opacity-20 text-white"
                                viewBox="0 0 820 280"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="410" cy="340" r="110" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                                <circle cx="410" cy="340" r="160" stroke="currentColor" strokeWidth="1" />
                                <circle cx="410" cy="340" r="210" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                                <circle cx="410" cy="340" r="260" stroke="currentColor" strokeWidth="1" />
                                <circle cx="410" cy="340" r="310" stroke="currentColor" strokeWidth="1" />
                                <path d="M 110 340 Q 410 80 710 340" stroke="currentColor" strokeWidth="1" />
                                <path d="M 180 340 Q 410 130 640 340" stroke="currentColor" strokeWidth="1" />
                                <path d="M 250 340 Q 410 180 570 340" stroke="currentColor" strokeWidth="1" />
                            </svg>

                            {/* Card Content Container */}
                            <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto px-4">
                                {/* Headline */}
                                <h2 className="vyom-serif text-3xl sm:text-5xl font-normal mb-3 text-white tracking-tight drop-shadow-sm">
                                    Every mind has a story.
                                </h2>

                                {/* Subtitle */}
                                <p className="text-sm sm:text-base text-white/80 max-w-md mx-auto mb-8 font-normal">
                                    Begin your cognitive journey with VyomFlow.
                                </p>

                                {/* Glowing 4-Point Star Emblem */}
                                <div className="mb-7 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.75)]">
                                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" />
                                    </svg>
                                </div>

                                {/* Glassmorphic Pill Button */}
                                <button
                                    onClick={handleBeginJourney}
                                    className="vyom-pill-btn-light !bg-white/85 hover:!bg-white !text-[#182338] !border-white/60 !py-3.5 !px-10 text-sm sm:text-base font-semibold shadow-xl backdrop-blur-md transition-all duration-300 transform hover:scale-[1.03]"
                                >
                                    <span>Begin Your Journey</span>
                                    <span className="text-lg leading-none">→</span>
                                </button>
                            </div>

                            {/* Bottom Inset Glow Mask */}
                            <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ boxShadow: 'inset 0px -32px 65px 0px #d5e2ff' }}></div>
                        </div>
                    </div>
                </section>
            </main>

            {/* =========================================================================
               17. REDESIGNED FOOTER (Spacious, Editorial Two-Part Layout)
               ========================================================================= */}
            <footer id="about" className="vyom-footer">
                <div className="vyom-footer-container">
                    {/* Main Two-Part Grid: Left Brand Block | Right Navigation Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12 border-b border-[#F7F4EC]/12">
                        {/* Left Brand Block (5 cols) */}
                        <div className="lg:col-span-5 flex flex-col items-start text-left">
                            {/* Logo & Wordmark */}
                            <div className="flex items-center gap-3 cursor-pointer mb-3" onClick={() => navigate("/")}>
                                <div className="w-9 h-9 rounded-full bg-[#4F7C78]/20 flex items-center justify-center text-[#8FAF8B]">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10m0 0C10.5 7.5 7 6 4 7c0 4 2.5 7.5 8 9m0-6c1.5-2.5 5-4 8-3 0 4-2.5 7.5-8 9" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="vyom-serif text-2xl font-semibold tracking-tight text-[#F7F4EC] block">
                                        VyomFlow
                                    </span>
                                </div>
                            </div>

                            {/* Tagline */}
                            <div className="vyom-serif text-sm font-normal text-[#C5D8D1] mb-3 italic">
                                Every Mind Has a Story.
                            </div>

                            {/* Brand Description */}
                            <p className="text-sm text-[#F7F4EC]/75 leading-relaxed max-w-sm mb-4">
                                Cognitive performance tracking designed for awareness and longitudinal self-observation.
                            </p>

                            {/* Privacy Trust Badge */}
                            <div className="vyom-trust-badge">
                                <div className="text-[#8FAF8B]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-[#F7F4EC]">Your mind. Your data.</div>
                                    <div className="text-[11px] text-[#F7F4EC]/65">Privacy-first by design.</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Navigation Group Columns (7 cols) */}
                        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                            {/* Column 1: EXPLORE */}
                            <div className="flex flex-col gap-3">
                                <div className="vyom-footer-group-title">EXPLORE</div>
                                <button onClick={() => handleScrollTo("how-it-works")} className="vyom-footer-link">
                                    How It Works
                                </button>
                                <button onClick={() => handleScrollTo("platform")} className="vyom-footer-link">
                                    Platform
                                </button>
                                <button onClick={() => handleScrollTo("about")} className="vyom-footer-link">
                                    About
                                </button>
                            </div>

                            {/* Column 2: SUPPORT */}
                            <div className="flex flex-col gap-3">
                                <div className="vyom-footer-group-title">SUPPORT</div>
                                <button onClick={handleBeginJourney} className="vyom-footer-link">
                                    Help & FAQ
                                </button>
                                <button onClick={() => navigate("/login")} className="vyom-footer-link">
                                    Contact Us
                                </button>
                            </div>

                            {/* Column 3: TRUST & LEGAL */}
                            <div className="flex flex-col gap-3 col-span-2 sm:col-span-1">
                                <div className="vyom-footer-group-title">TRUST</div>
                                <button onClick={() => handleScrollTo("privacy")} className="vyom-footer-link">
                                    Privacy Policy
                                </button>
                                <button onClick={() => handleScrollTo("privacy")} className="vyom-footer-link">
                                    Disclaimer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Medical Disclaimer */}
                    <div className="pt-8 pb-6 text-xs text-[#F7F4EC]/55 leading-relaxed max-w-4xl text-left">
                        VyomFlow is designed for personal cognitive awareness and longitudinal observation. It does not provide medical diagnosis or treatment advice.
                    </div>

                    {/* Bottom Legal Bar */}
                    <div className="pt-4 border-t border-[#F7F4EC]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F4EC]/50">
                        <div>
                            © {new Date().getFullYear()} VyomFlow. All rights reserved.
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => handleScrollTo("privacy")} className="hover:text-[#F7F4EC] transition-colors">
                                Privacy
                            </button>
                            <button onClick={() => handleScrollTo("privacy")} className="hover:text-[#F7F4EC] transition-colors">
                                Terms
                            </button>
                            <button onClick={() => handleScrollTo("privacy")} className="hover:text-[#F7F4EC] transition-colors">
                                Disclaimer
                            </button>
                        </div>
                    </div>

                    {/* Giant Video-Masked Brand Typography Signature (VYOMFLOW) */}
                    <VyomFlowVideoBrand />
                </div>
            </footer>
        </div>
    );
}
