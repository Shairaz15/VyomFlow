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
        <div className="vyom-sarvam-landing flex flex-col min-h-screen selection:bg-[#4F7C78]/20 selection:text-[#17324D] overflow-x-hidden">
            {/* =========================================================================
               1. DESKTOP FLOATING NAVBAR (>= 768px - Spacious & Cinematic)
               ========================================================================= */}
            <div className="hidden md:block vyom-top-blur-mask" aria-hidden="true" />

            <div className="hidden md:flex vyom-navbar-fixed-container">
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
                    <nav className="flex items-center gap-6">
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
                    <div className="flex items-center gap-2.5">
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
                </header>
            </div>

            {/* =========================================================================
               2. DEDICATED STICKY MOBILE HEADER (< 768px - Compact & Touch-Friendly)
               ========================================================================= */}
            <header className="vyom-mobile-header">
                <div 
                    className="flex items-center gap-2.5 cursor-pointer select-none" 
                    onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                    <div className="vyom-leaf-logo w-8 h-8 rounded-full bg-[#8FAF8B]/20 flex items-center justify-center text-[#8FAF8B] transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10m0 0C10.5 7.5 7 6 4 7c0 4 2.5 7.5 8 9m0-6c1.5-2.5 5-4 8-3 0 4-2.5 7.5-8 9" />
                        </svg>
                    </div>
                    <span className="vyom-serif text-xl font-bold tracking-tight text-inherit transition-colors">
                        VyomFlow
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        className="vyom-header-btn w-11 h-11 flex items-center justify-center text-inherit rounded-full hover:bg-black/5 active:scale-95 transition-all"
                    >

                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Panel Drawer */}
            {mobileMenuOpen && (
                <div className="vyom-mobile-drawer animate-fadeIn">
                    <nav className="flex flex-col gap-2.5">
                        <button onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="vyom-mobile-nav-item">
                            <span>Home</span>
                            <span className="text-[#8FAF8B]">→</span>
                        </button>
                        <button onClick={() => handleScrollTo("how-it-works")} className="vyom-mobile-nav-item">
                            <span>How It Works</span>
                            <span className="text-[#8FAF8B]">→</span>
                        </button>

                        <button onClick={() => handleScrollTo("platform")} className="vyom-mobile-nav-item">
                            <span>Platform</span>
                            <span className="text-[#8FAF8B]">→</span>
                        </button>
                        <button onClick={() => handleScrollTo("privacy")} className="vyom-mobile-nav-item">
                            <span>Privacy</span>
                            <span className="text-[#8FAF8B]">→</span>
                        </button>
                        <button onClick={() => handleScrollTo("about")} className="vyom-mobile-nav-item">
                            <span>About</span>
                            <span className="text-[#8FAF8B]">→</span>
                        </button>
                        <button onClick={() => { setMobileMenuOpen(false); navigate("/demo"); }} className="vyom-mobile-nav-item">
                            <span>Help & FAQ</span>
                            <span className="text-[#8FAF8B]">→</span>
                        </button>
                    </nav>

                    <div className="flex flex-col gap-3 pt-6 border-t border-white/10 dark:border-[#17324D]/15 mt-auto pb-safe">
                        <button
                            onClick={() => { setMobileMenuOpen(false); handleBeginJourney(); }}
                            className="w-full h-[54px] rounded-[28px] bg-[#4F7C78] hover:bg-[#3D6360] text-[#F7F4EC] text-base font-semibold shadow-lg justify-center flex items-center gap-2 active:scale-[0.98] transition-all"
                        >
                            <span>Begin Your Journey</span>
                            <span className="text-lg">→</span>
                        </button>
                        <button
                            onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                            className="w-full h-[54px] rounded-[28px] bg-[#F7F4EC] dark:bg-[#17324D] hover:bg-[#EDE8DC] dark:hover:bg-[#102031] text-[#17324D] dark:text-[#F7F4EC] text-sm font-semibold justify-center flex items-center active:scale-[0.98] transition-all"
                        >
                            Contact Us
                        </button>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-[#BFD0D7] dark:text-[#334E68]">Language:</span>
                            <VerifiedLanguageSwitcher />
                        </div>
                    </div>
                </div>
            )}


            <main className="flex-1 w-full flex flex-col items-center pt-16 md:pt-0">
                {/* =========================================================================
                   3. DESKTOP HERO SECTION (Spacious, Centered for >= 768px)
                   ========================================================================= */}
                <section id="hero" className="hidden md:flex vyom-hero-section w-full flex-col items-center justify-between text-center px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto flex flex-col items-center justify-between flex-1 py-4 w-full h-full">
                        {/* Hero Text Block */}
                        <div className="flex flex-col items-center my-auto pt-6">
                            {/* HERO EYEBROW */}
                            <div className="vyom-hero-eyebrow mb-6">
                                <span>AI-FIRST COGNITIVE HEALTH PLATFORM</span>
                            </div>

                            {/* HERO HEADLINE — ELEGANT SERIF TWO-TONE */}
                            <h1 className="vyom-hero-title mb-7">
                                <span className="vyom-title-navy">Understand</span>{" "}
                                <span className="vyom-title-teal">your mind.</span>
                                <br />
                                <span className="vyom-title-navy">Journey with</span>{" "}
                                <span className="vyom-title-teal">confidence.</span>
                            </h1>

                            {/* HERO DESCRIPTION */}
                            <p className="vyom-hero-sub mb-14 sm:mb-20 max-w-2xl mx-auto">
                                VyomFlow helps you track cognitive performance over time through engaging activities, powered by AI.
                            </p>
                        </div>

                        {/* HERO BUTTONS AT BOTTOM OF FOLD */}
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
                   4. DEDICATED MOBILE HERO SECTION (< 768px - Focused, Calm, Guided)
                   ========================================================================= */}
                <section className="md:hidden vyom-mobile-hero-section">
                    {/* Small Eyebrow */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4F7C78]/12 text-[#4F7C78] dark:text-[#8FAF8B] text-[11px] font-bold tracking-[0.18em] uppercase mb-4">
                        <span>AI-FIRST COGNITIVE HEALTH PLATFORM</span>
                    </div>

                    {/* Large Mobile Heading (42–48px Editorial Hierarchy) */}
                    <h1 className="vyom-mobile-hero-heading text-[42px] leading-[1.04] tracking-tight mb-3 text-center">
                        <span className="vyom-mobile-title-navy">Understand your </span>
                        <span className="vyom-mobile-title-teal">mind.</span>
                        <br />
                        <span className="vyom-mobile-title-navy">Journey with </span>
                        <span className="vyom-mobile-title-teal">confidence.</span>
                    </h1>

                    {/* Subtitle (16px dark slate readable contrast) */}
                    <p className="text-[16px] leading-[1.55] text-[#334E68] dark:text-[#B0C4DE] max-w-[330px] mx-auto mb-6">
                        Track cognitive performance over time through engaging activities, powered by AI.
                    </p>

                    {/* Primary & Secondary Action Buttons (Stacked, 54px height, 28px radius) */}
                    <div className="flex flex-col gap-3 w-full max-w-[340px] mx-auto mb-7">
                        <button
                            onClick={handleBeginJourney}
                            className="w-full h-[54px] rounded-[28px] bg-[#17324D] hover:bg-[#102031] text-[#F7F4EC] text-[16px] font-semibold shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                            <span>Begin Your Journey</span>
                            <span className="text-lg leading-none">→</span>
                        </button>
                        <button
                            onClick={() => handleScrollTo("how-it-works")}
                            className="w-full h-[54px] rounded-[28px] vyom-mobile-btn-secondary text-[15px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all"
                        >
                            Learn How It Works
                        </button>
                    </div>

                    {/* Refined Trust Indicators (Clean SVG Line Icons, wrapping naturally) */}
                    <div className="flex items-center justify-center gap-x-4 gap-y-2 text-[13px] text-[#4F7C78] dark:text-[#8FAF8B] font-medium mb-7 flex-wrap max-w-[340px] mx-auto">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Privacy First
                        </span>
                        <span className="text-[#8FAF8B]/60">•</span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                            </svg>
                            Evidence-Informed
                        </span>
                        <span className="text-[#8FAF8B]/60">•</span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Designed for You
                        </span>
                    </div>

                    {/* Centered Mobile Brain Visual with Subtle Ambient Radial Glow */}
                    <div className="relative w-full max-w-[320px] mx-auto flex items-center justify-center pt-2 pb-4">
                        {/* Soft Ambient Aura */}
                        <div className="absolute inset-0 m-auto w-[240px] h-[240px] rounded-full bg-radial from-[#8FAF8B]/15 via-[#4F7C78]/8 to-transparent filter blur-2xl pointer-events-none" />
                        <div className="relative z-10 w-full">
                            <ScientificBrainCanvas />
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                   5. SECTION AFTER HERO — HOW VYOMFLOW WORKS
                   ========================================================================= */}
                <section id="how-it-works" className="vyom-section scroll-mt-20 py-12 md:py-16 flex flex-col items-center justify-center">
                    {/* Section Header */}
                    <div className="text-center mb-8 md:mb-16 px-4">
                        <h2 className="vyom-serif vyom-heading-dark text-3xl sm:text-4xl mb-3">
                            How VyomFlow Works
                        </h2>
                        <p className="text-sm sm:text-base vyom-sub-dark max-w-lg mx-auto text-center leading-relaxed">
                            Three simple steps for meaningful cognitive tracking over time.
                        </p>
                    </div>

                    {/* DESKTOP TRUE ORBITAL SYSTEM (>= 768px) */}
                    <div className="hidden md:block relative w-full max-w-[720px] mx-auto min-h-[680px]">
                        <div className="vyom-orbit-stage">
                            {/* MATHEMATICALLY CENTERED FIXED VYOMFLOW CORE NODE */}
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

                            {/* SVG PERFECT DASHED ORBIT CIRCLE */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-5" viewBox="0 0 680 680" fill="none">
                                <circle cx="340" cy="340" r="280" stroke="#8FAF8B" strokeWidth="2" strokeDasharray="6 6" strokeOpacity="0.38" />
                                <circle cx="340" cy="340" r="145" stroke="#4F7C78" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2" />
                            </svg>

                            {/* REVOLVING ORBIT RING CONTAINER */}
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

                    {/* DEDICATED MOBILE VERTICAL COGNITIVE FLOW (< 768px - Premium Light Cards) */}
                    <div className="md:hidden relative flex flex-col items-center gap-4 w-full max-w-[340px] mx-auto px-4 py-2">
                        {/* Subtle Vertical Connector Line behind Cards */}
                        <div className="absolute top-8 bottom-8 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-[#8FAF8B]/60 via-[#4F7C78]/60 to-[#D8B878]/60 z-0 pointer-events-none" />

                        {/* Step 01: PLAY */}
                        <div className="relative z-10 vyom-mobile-step-card bg-[#FBFAF6] dark:bg-[#14283C] border border-[#4F7C78]/25 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-[#8FAF8B]/20 text-[#4F7C78] dark:text-[#8FAF8B] flex items-center justify-center mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-[12px] font-bold tracking-widest text-[#4F7C78] uppercase mb-1">01 • PLAY</div>
                            <h3 className="vyom-serif font-bold text-xl text-[#17324D] dark:text-[#F7F4EC] mb-1.5">Engage Naturally</h3>
                            <p className="text-[14px] text-[#486581] dark:text-[#B0C4DE] leading-relaxed text-center">
                                Complete short cognitive activities designed to observe performance without stress.
                            </p>
                        </div>

                        {/* Step 02: TRACK */}
                        <div className="relative z-10 vyom-mobile-step-card bg-[#FBFAF6] dark:bg-[#14283C] border border-[#4F7C78]/25 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-[#4F7C78]/20 text-[#4F7C78] dark:text-[#8FAF8B] flex items-center justify-center mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                </svg>
                            </div>
                            <div className="text-[12px] font-bold tracking-widest text-[#4F7C78] uppercase mb-1">02 • TRACK</div>
                            <h3 className="vyom-serif font-bold text-xl text-[#17324D] dark:text-[#F7F4EC] mb-1.5">Observe Trends</h3>
                            <p className="text-[14px] text-[#486581] dark:text-[#B0C4DE] leading-relaxed text-center">
                                Build a picture of your cognitive performance patterns over time.
                            </p>
                        </div>

                        {/* Step 03: UNDERSTAND */}
                        <div className="relative z-10 vyom-mobile-step-card bg-[#FBFAF6] dark:bg-[#14283C] border border-[#4F7C78]/25 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-[#D8B878]/25 text-[#A88752] dark:text-[#D8B878] flex items-center justify-center mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="text-[12px] font-bold tracking-widest text-[#A88752] uppercase mb-1">03 • UNDERSTAND</div>
                            <h3 className="vyom-serif font-bold text-xl text-[#17324D] dark:text-[#F7F4EC] mb-1.5">Gain Clarity</h3>
                            <p className="text-[14px] text-[#486581] dark:text-[#B0C4DE] leading-relaxed text-center">
                                See meaningful patterns and build awareness of your brain health journey.
                            </p>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                   6. JOURNEY SECTION — YOUR COGNITIVE JOURNEY
                   ========================================================================= */}
                <section id="platform" className="vyom-section scroll-mt-20 relative overflow-hidden py-10">
                    <div className="text-center mb-8 relative z-20 px-4">
                        <h2 className="vyom-serif vyom-heading-dark text-3xl sm:text-4xl mb-3">
                            Your Cognitive Journey
                        </h2>
                        <p className="text-sm sm:text-base vyom-sub-dark max-w-lg mx-auto text-center leading-relaxed">
                            Explore guided activities designed to observe key cognitive domains over time.
                        </p>
                    </div>

                    {/* DESKTOP RADIAL ORBITAL MAP (>= 1024px) */}
                    <div className="hidden lg:block relative w-full max-w-[1240px] mx-auto min-h-[660px]">
                        {/* Connecting Neural Pathway Lines (SVG Overlay) */}
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-45"
                            viewBox="0 0 1240 660"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
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
                            onClick={() => navigate("/test/story")}
                            className="vyom-orbital-card absolute top-[2%] left-1/2 -translate-x-1/2"
                        >
                            <div className="vyom-orbital-icon">🌳</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Story Grove</h4>
                                <p className="text-xs text-[#66757A]">Story Narration Recall</p>
                            </div>
                        </div>

                        {/* 2. Memory Garden (Top Left) */}
                        <div
                            onClick={() => navigate("/test/vmra")}
                            className="vyom-orbital-card absolute top-[16%] left-[4%]"
                        >
                            <div className="vyom-orbital-icon">🌷</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Memory Garden</h4>
                                <p className="text-xs text-[#66757A]">Visual Memory</p>
                            </div>
                        </div>

                        {/* 3. Firefly Trail (Top Right) */}
                        <div
                            onClick={() => navigate("/test/reaction")}
                            className="vyom-orbital-card absolute top-[16%] right-[4%]"
                        >
                            <div className="vyom-orbital-icon">✨</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Firefly Trail</h4>
                                <p className="text-xs text-[#66757A]">Reaction Time</p>
                            </div>
                        </div>

                        {/* 4. Pattern Pond (Mid Left) */}
                        <div
                            onClick={() => navigate("/tests/pattern")}
                            className="vyom-orbital-card absolute top-[50%] left-[1%]"
                        >
                            <div className="vyom-orbital-icon">🌊</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Pattern Pond</h4>
                                <p className="text-xs text-[#66757A]">Pattern Recognition</p>
                            </div>
                        </div>

                        {/* 5. Focus Meadow (Mid Right) */}
                        <div
                            onClick={() => navigate("/test/attention")}
                            className="vyom-orbital-card absolute top-[50%] right-[1%]"
                        >
                            <div className="vyom-orbital-icon">🎯</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Focus Meadow</h4>
                                <p className="text-xs text-[#66757A]">Sustained Attention</p>
                            </div>
                        </div>

                        {/* 6. Discovery Trail (Bottom Left) */}
                        <div
                            onClick={() => navigate("/test/navigation")}
                            className="vyom-orbital-card absolute bottom-[4%] left-[12%]"
                        >
                            <div className="vyom-orbital-icon">🧭</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Discovery Trail</h4>
                                <p className="text-xs text-[#66757A]">Immersive Navigation</p>
                            </div>
                        </div>

                        {/* 7. Story Corner (Bottom Right) */}
                        <div
                            onClick={() => navigate("/test/language")}
                            className="vyom-orbital-card absolute bottom-[4%] right-[12%]"
                        >
                            <div className="vyom-orbital-icon">📖</div>
                            <div>
                                <h4 className="font-semibold text-sm text-[#17324D]">Story Corner</h4>
                                <p className="text-xs text-[#66757A]">Language Assessment</p>
                            </div>
                        </div>
                    </div>

                    {/* DEDICATED MOBILE VERTICAL JOURNEY PATH (< 1024px) */}
                    <div className="lg:hidden w-full max-w-[360px] mx-auto px-4 py-2">
                        <div className="flex flex-col gap-3 relative">
                            {/* Connecting Path Track */}
                            <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#8FAF8B]/60 via-[#4F7C78]/60 to-[#D8B878]/60 z-0" />

                            {/* 01 Story Grove */}
                            <div
                                onClick={() => navigate("/test/story")}
                                className="vyom-mobile-journey-node z-10"
                            >
                                <div className="vyom-mobile-node-badge border-[#8FAF8B] text-[#8FAF8B]">
                                    <span className="text-lg">🌳</span>
                                    <span className="vyom-mobile-node-num">01</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#17324D] dark:text-[#F7F4EC] truncate">Story Grove</h4>
                                        <span className="vyom-node-status-pill">Start →</span>
                                    </div>
                                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] truncate">Story Narration Recall</p>
                                </div>
                            </div>

                            {/* 02 Memory Garden */}
                            <div
                                onClick={() => navigate("/test/vmra")}
                                className="vyom-mobile-journey-node z-10"
                            >
                                <div className="vyom-mobile-node-badge border-[#4F7C78] text-[#4F7C78]">
                                    <span className="text-lg">🌷</span>
                                    <span className="vyom-mobile-node-num">02</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#17324D] dark:text-[#F7F4EC] truncate">Memory Garden</h4>
                                        <span className="vyom-node-status-pill">Start →</span>
                                    </div>
                                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] truncate">Visual Memory</p>
                                </div>
                            </div>

                            {/* 03 Firefly Trail */}
                            <div
                                onClick={() => navigate("/test/reaction")}
                                className="vyom-mobile-journey-node z-10"
                            >
                                <div className="vyom-mobile-node-badge border-[#D8B878] text-[#D8B878]">
                                    <span className="text-lg">✨</span>
                                    <span className="vyom-mobile-node-num">03</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#17324D] dark:text-[#F7F4EC] truncate">Firefly Trail</h4>
                                        <span className="vyom-node-status-pill">Start →</span>
                                    </div>
                                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] truncate">Reaction Time</p>
                                </div>
                            </div>

                            {/* 04 Pattern Pond */}
                            <div
                                onClick={() => navigate("/tests/pattern")}
                                className="vyom-mobile-journey-node z-10"
                            >
                                <div className="vyom-mobile-node-badge border-[#4F7C78] text-[#4F7C78]">
                                    <span className="text-lg">🌊</span>
                                    <span className="vyom-mobile-node-num">04</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#17324D] dark:text-[#F7F4EC] truncate">Pattern Pond</h4>
                                        <span className="vyom-node-status-pill">Start →</span>
                                    </div>
                                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] truncate">Pattern Recognition</p>
                                </div>
                            </div>

                            {/* 05 Focus Meadow */}
                            <div
                                onClick={() => navigate("/test/attention")}
                                className="vyom-mobile-journey-node z-10"
                            >
                                <div className="vyom-mobile-node-badge border-[#8FAF8B] text-[#8FAF8B]">
                                    <span className="text-lg">🎯</span>
                                    <span className="vyom-mobile-node-num">05</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#17324D] dark:text-[#F7F4EC] truncate">Focus Meadow</h4>
                                        <span className="vyom-node-status-pill">Start →</span>
                                    </div>
                                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] truncate">Sustained Attention</p>
                                </div>
                            </div>

                            {/* 06 Discovery Trail */}
                            <div
                                onClick={() => navigate("/test/navigation")}
                                className="vyom-mobile-journey-node z-10"
                            >
                                <div className="vyom-mobile-node-badge border-[#4F7C78] text-[#4F7C78]">
                                    <span className="text-lg">🧭</span>
                                    <span className="vyom-mobile-node-num">06</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#17324D] dark:text-[#F7F4EC] truncate">Discovery Trail</h4>
                                        <span className="vyom-node-status-pill">Start →</span>
                                    </div>
                                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] truncate">Immersive Navigation</p>
                                </div>
                            </div>

                            {/* 07 Story Corner */}
                            <div
                                onClick={() => navigate("/test/language")}
                                className="vyom-mobile-journey-node z-10"
                            >
                                <div className="vyom-mobile-node-badge border-[#D8B878] text-[#D8B878]">
                                    <span className="text-lg">📖</span>
                                    <span className="vyom-mobile-node-num">07</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-sm text-[#17324D] dark:text-[#F7F4EC] truncate">Story Corner</h4>
                                        <span className="vyom-node-status-pill">Start →</span>
                                    </div>
                                    <p className="text-xs text-[#66757A] dark:text-[#A0B0BA] truncate">Language Assessment</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                   7. PRIVACY SECTION — SOFT TINTED CARDS
                   ========================================================================= */}
                <section id="privacy" className="vyom-privacy-section scroll-mt-20 py-12 px-4 sm:px-6 w-full">
                    <div className="vyom-privacy-panel max-w-5xl mx-auto">
                        {/* Centered Heading & Subtitle */}
                        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
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

                        {/* 3 Principles (Soft Tinted Individual Boxes: Sage -> Blue -> Gold) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                            {/* Principle 01: Private by Design (Soft Sage Tint: #EAF3EF, Accent: #4F7C78) */}
                            <div className="vyom-privacy-card vyom-privacy-card-sage">
                                <div className="vyom-privacy-icon-box">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-[#17324D]">Private by Design</h3>
                                <p className="text-xs sm:text-sm text-[#465A65] leading-relaxed">
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
                                <h3 className="font-bold text-lg mb-2 text-[#17324D]">You Own Your Data</h3>
                                <p className="text-xs sm:text-sm text-[#465A65] leading-relaxed">
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
                                <h3 className="font-bold text-lg mb-2 text-[#17324D]">Awareness, Not Diagnosis</h3>
                                <p className="text-xs sm:text-sm text-[#465A65] leading-relaxed">
                                    Designed for self-observation and long-term awareness, maintaining clear boundaries with medical diagnosis.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================================================================
                   8. FINAL CTA BANNER (Responsive Floating Card)
                   ========================================================================= */}
                <section className="px-4 md:px-8 py-10 max-w-[1280px] w-full mx-auto">
                    <div className="bg-white dark:bg-[#1E2D47] rounded-[32px] md:rounded-[64px] border border-black/5 dark:border-white/10 p-2 sm:p-4 shadow-xl">
                        <div 
                            className="relative flex flex-col justify-center items-center rounded-[24px] md:rounded-[52px] min-h-[380px] sm:min-h-[450px] overflow-hidden p-6 sm:p-10" 
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

                            {/* Background Arc Grid Hemisphere */}
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

                            {/* Card Content */}
                            <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto px-2">
                                <h2 className="vyom-serif text-2xl sm:text-4xl md:text-5xl font-normal mb-3 text-white tracking-tight drop-shadow-sm">
                                    Every mind has a story.
                                </h2>

                                <p className="text-sm sm:text-base text-white font-medium max-w-md mx-auto mb-6 drop-shadow-sm">
                                    Begin your cognitive journey with VyomFlow.
                                </p>

                                <div className="mb-6 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.75)]">
                                    <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" />
                                    </svg>
                                </div>

                                <button
                                    onClick={handleBeginJourney}
                                    className="vyom-pill-btn-light !bg-white/90 hover:!bg-white !text-[#182338] !border-white/60 !py-3.5 !px-8 sm:!px-10 text-sm sm:text-base font-semibold shadow-xl backdrop-blur-md transition-all duration-300 transform active:scale-95"
                                >
                                    <span>Begin Your Journey</span>
                                    <span className="text-lg leading-none">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* =========================================================================
               9. FOOTER (Responsive Two-Part Layout)
               ========================================================================= */}
            <footer id="about" className="vyom-footer w-full">
                <div className="vyom-footer-container">
                    {/* Grid: Left Brand Block | Right Navigation Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-[#F7F4EC]/12">
                        {/* Brand Block */}
                        <div className="lg:col-span-5 flex flex-col items-start text-left">
                            <div className="flex items-center gap-3 cursor-pointer mb-3" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
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

                            <div className="vyom-serif text-sm font-normal text-[#C5D8D1] mb-2 italic">
                                Every Mind Has a Story.
                            </div>

                            <p className="text-xs sm:text-sm text-[#F7F4EC]/75 leading-relaxed max-w-sm mb-4">
                                Cognitive performance tracking designed for awareness and longitudinal self-observation.
                            </p>

                            <div className="vyom-trust-badge w-full max-w-[320px]">
                                <div className="text-[#8FAF8B] text-xl">🔒</div>
                                <div>
                                    <div className="text-xs font-semibold text-[#F7F4EC]">Your mind. Your data.</div>
                                    <div className="text-[11px] text-[#F7F4EC]/65">Privacy-first by design.</div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Columns */}
                        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-2 lg:pt-0">
                            {/* Column 1: EXPLORE */}
                            <div className="flex flex-col gap-2.5">
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
                            <div className="flex flex-col gap-2.5">
                                <div className="vyom-footer-group-title">SUPPORT</div>
                                <button onClick={handleBeginJourney} className="vyom-footer-link">
                                    Help & FAQ
                                </button>
                                <button onClick={() => navigate("/login")} className="vyom-footer-link">
                                    Contact Us
                                </button>
                            </div>

                            {/* Column 3: TRUST & LEGAL */}
                            <div className="flex flex-col gap-2.5 col-span-2 sm:col-span-1">
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

                    {/* Medical Disclaimer */}
                    <div className="pt-6 pb-4 text-xs text-[#F7F4EC]/55 leading-relaxed max-w-4xl text-left">
                        VyomFlow is designed for personal cognitive awareness and longitudinal observation. It does not provide medical diagnosis or treatment advice.
                    </div>

                    {/* Bottom Legal Bar */}
                    <div className="pt-4 border-t border-[#F7F4EC]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#F7F4EC]/50">
                        <div>
                            © {new Date().getFullYear()} VyomFlow. All rights reserved.
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6">
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

                    {/* Scaled Video-Masked Brand Typography */}
                    <div className="w-full overflow-hidden mt-4">
                        <VyomFlowVideoBrand />
                    </div>

                </div>
            </footer>
        </div>
    );
}
