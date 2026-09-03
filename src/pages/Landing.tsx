import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import "./Landing.css";

export function Landing() {
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Trend Animation States
    const TRENDS = [
        {
            id: 'stable',
            label: t('landing.stableTrend'),
            color: 'text-accent',
            colorHex: '#2dd4bf',
            path: 'M 0 50 Q 50 45, 100 50 T 200 50'
        },
        {
            id: 'declining',
            label: t('landing.decliningTrend'),
            color: 'text-warning',
            colorHex: '#fbbf24',
            path: 'M 0 30 Q 50 35, 100 50 T 200 70'
        },
        {
            id: 'improving',
            label: t('landing.improvingTrend'),
            color: 'text-success',
            colorHex: '#34d399',
            path: 'M 0 70 Q 50 60, 100 40 T 200 20'
        }
    ];

    const [trendIndex, setTrendIndex] = useState(0);
    const targetTrend = TRENDS[trendIndex];

    // Custom hook for smooth interpolation
    const useSmoothTrend = (target: typeof TRENDS[0], duration = 1500) => {
        const [currentPath, setCurrentPath] = useState(target.path);
        const [currentColor, setCurrentColor] = useState(target.colorHex);
        const requestRef = useRef<number | null>(null);
        const startTimeRef = useRef<number | undefined>(undefined);
        const startValuesRef = useRef({ path: target.path, color: target.colorHex });

        // Helper to parse path string into numbers
        const parsePath = (d: string) => d.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];

        // Helper to reconstruct path string
        const buildPath = (nums: number[]) =>
            `M ${nums[0]} ${nums[1]} Q ${nums[2]} ${nums[3]}, ${nums[4]} ${nums[5]} T ${nums[6]} ${nums[7]}`;

        // Helper to parse hex to rgb
        const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };

        // Helper to stringify rgb
        const rgbToHex = (r: number, g: number, b: number) =>
            "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');

        useEffect(() => {
            startValuesRef.current = { path: currentPath, color: currentColor };
            startTimeRef.current = undefined;

            const animate = (time: number) => {
                if (startTimeRef.current === undefined) startTimeRef.current = time;
                const progress = Math.min((time - startTimeRef.current) / duration, 1);

                // Ease function (cubic-bezier approximation)
                const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

                // Path Interpolation
                const startNums = parsePath(startValuesRef.current.path);
                const endNums = parsePath(target.path);
                const currentNums = startNums.map((start, i) => start + (endNums[i] - start) * ease);
                const newPath = buildPath(currentNums);

                // Color Interpolation
                const startColor = hexToRgb(startValuesRef.current.color);
                const endColor = hexToRgb(target.colorHex);
                const newColorRgb = startColor.map((c, i) => c + (endColor[i] - c) * ease);
                const newColor = rgbToHex(newColorRgb[0], newColorRgb[1], newColorRgb[2]);

                setCurrentPath(newPath);
                setCurrentColor(newColor);

                if (progress < 1) {
                    requestRef.current = requestAnimationFrame(animate);
                }
            };

            requestRef.current = requestAnimationFrame(animate);
            return () => {
                if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
            };
        }, [target.id]); // Re-run when target changes

        return { path: currentPath, color: currentColor };
    };

    const animatedTrend = useSmoothTrend(targetTrend, 1500);

    // Initial Timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTrendIndex((prev) => (prev + 1) % TRENDS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleStart = () => {
        if (disclaimerAccepted) {
            navigate("/tests");
        }
    };

    return (
        <div className="landing">
            {/* Background Effects - Aurora mesh */}
            <div className="landing-bg">
                <div className="bg-aurora-mesh" />
                <div className="bg-gradient-orb bg-orb-1" />
                <div className="bg-gradient-orb bg-orb-2" />
                <div className="bg-noise" />
            </div>

            {/* Hero Section - Antigravity Layout */}
            <section className="hero">
                <div className="hero-bento">
                    {/* CENTERPIECE: Bio-Digital Brain */}
                    <div className="logo-wrapper animate-fadeIn">
                        <img
                            src="/logo.png"
                            alt="VyomFlow Brain Logo"
                            className="antigravity-logo"
                        />
                    </div>

                    {/* HERO CONTENT */}
                    <div className="hero-content animate-fadeInUp">
                        <span className="hero-badge animate-fadeIn">
                            <span className="badge-dot" />
                            {t('landing.badge')}
                        </span>

                        <h1 className="hero-title">
                            <span className="brand-name">{t('landing.brandName')}</span>
                            <br />
                            <span className="text-gradient">{t('landing.heroTagline')}</span>
                        </h1>

                        <p className="hero-subtitle">
                            {t('landing.heroSubtitle')}
                        </p>

                        {/* Stats Bar */}
                        <div className="hero-stats animate-fadeIn delay-200">
                            <div className="stat-item">
                                <span className="stat-number">4</span>
                                <span className="stat-label">{t('landing.statTests')}</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat-item">
                                <span className="stat-number">ML</span>
                                <span className="stat-label">{t('landing.statML')}</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat-item">
                                <span className="stat-number">100%</span>
                                <span className="stat-label">{t('landing.statPrivacy')}</span>
                            </div>
                        </div>

                        {/* Disclaimer Card */}
                        <div className="disclaimer-card glass-card animate-fadeIn delay-400">
                            <div className="disclaimer-header">
                                <Icon name="info" size={20} animated />
                                <span className="disclaimer-title">{t('landing.disclaimerTitle')}</span>
                            </div>
                            <p className="disclaimer-text">{t('disclaimer.main')}</p>
                            <label className="disclaimer-checkbox">
                                <input
                                    type="checkbox"
                                    checked={disclaimerAccepted}
                                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                />
                                <span className="checkbox-custom">
                                    {disclaimerAccepted && <Icon name="check" size={14} />}
                                </span>
                                <span>{t('landing.disclaimerAccept')}</span>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="hero-actions animate-fadeIn delay-500 flex flex-wrap gap-3">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleStart}
                                disabled={!disclaimerAccepted}
                                aria-label={disclaimerAccepted ? "Start cognitive assessment" : "Please accept the disclaimer to start assessment"}
                            >
                                {t('landing.startAssessment')}
                            </Button>

                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={() => navigate('/ml-playground')}
                                aria-label="Open ML Model Live Predictor Playground"
                            >
                                🧠 Live ML Predictor
                            </Button>
                        </div>
                    </div>

                    {/* Simulation Card - Trend Line Preview */}
                    <div className="hero-simulation glass-card floating animate-fadeIn delay-300">
                        <div className="simulation-header">
                            <Icon name="chart-line-up" size={20} />
                            <span>{t('landing.trendPreview')}</span>
                        </div>
                        <svg className="simulation-chart" viewBox="0 0 200 80" preserveAspectRatio="none">
                            <path
                                className="simulation-line"
                                d={animatedTrend.path} // Animated Path
                                fill="none"
                                stroke={animatedTrend.color} // Animated Color
                                strokeWidth="3"
                                strokeLinecap="round"
                                style={{ transition: 'none' }} // Disable CSS transition to let JS handle it
                            />
                        </svg>
                        <div className="simulation-labels">
                            <span>{t('landing.sessions')}</span>
                            {/* Key forces re-render of fade animation on label text only */}
                            <span key={targetTrend.id} className={`trend-label ${targetTrend.color} animate-fadeIn`}>
                                {targetTrend.label}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="workflow-section container">
                <div className="section-header animate-fadeInUp">
                    <span className="section-badge">{t('landing.howItWorks')}</span>
                    <h2 className="section-title">
                        {t('landing.fromAssessmentTo')} <span className="text-gradient">{t('landing.insights')}</span>
                    </h2>
                    <p className="section-subtitle">
                        {t('landing.howItWorksSubtitle')}
                    </p>
                </div>

                <div className="workflow-timeline">
                    <svg className="workflow-connector" viewBox="0 0 4 400" preserveAspectRatio="none">
                        <line
                            className="connector-line"
                            x1="2" y1="0" x2="2" y2="400"
                            stroke="url(#connectorGradient)"
                            strokeWidth="2"
                        />
                        <defs>
                            <linearGradient id="connectorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#5eead4" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#5eead4" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="workflow-step animate-fadeInUp delay-100">
                        <div className="step-number">01</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="assess" size={28} animated />
                            </div>
                            <h3>{t('landing.step1Title')}</h3>
                            <p>{t('landing.step1Desc')}</p>
                        </div>
                    </div>

                    <div className="workflow-step animate-fadeInUp delay-200">
                        <div className="step-number">02</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="analyze" size={28} animated />
                            </div>
                            <h3>{t('landing.step2Title')}</h3>
                            <p>{t('landing.step2Desc')}</p>
                        </div>
                    </div>

                    <div className="workflow-step animate-fadeInUp delay-300">
                        <div className="step-number">03</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="timeline" size={28} animated />
                            </div>
                            <h3>{t('landing.step3Title')}</h3>
                            <p>{t('landing.step3Desc')}</p>
                        </div>
                    </div>

                    <div className="workflow-step animate-fadeInUp delay-400">
                        <div className="step-number">04</div>
                        <div className="step-content glass-card">
                            <div className="step-icon">
                                <Icon name="insight" size={28} animated />
                            </div>
                            <h3>{t('landing.step4Title')}</h3>
                            <p>{t('landing.step4Desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - Bento Grid */}
            <section className="features-section container">
                <div className="section-header animate-fadeInUp">
                    <h2 className="section-title">
                        {t('landing.comprehensive')} <span className="text-gradient">{t('landing.cognitiveAssessment')}</span> {t('landing.assessmentSuffix')}
                    </h2>
                </div>

                <div className="features-grid">
                    <div className="feature-card glass-card floating animate-fadeInUp delay-100">
                        <div className="feature-icon-wrapper">
                            <Icon name="memory" size={32} animated />
                        </div>
                        <h3>{t('landing.memoryRecall')}</h3>
                        <p>{t('landing.memoryRecallDesc')}</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            {t('landing.duration', { min: '2' })}
                        </span>
                    </div>

                    <div className="feature-card glass-card floating animate-fadeInUp delay-200">
                        <div className="feature-icon-wrapper">
                            <Icon name="reaction" size={32} animated />
                        </div>
                        <h3>{t('landing.reactionTime')}</h3>
                        <p>{t('landing.reactionTimeDesc')}</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            {t('landing.duration', { min: '1' })}
                        </span>
                    </div>

                    <div className="feature-card glass-card floating animate-fadeInUp delay-300">
                        <div className="feature-icon-wrapper">
                            <Icon name="pattern" size={32} animated />
                        </div>
                        <h3>{t('landing.patternRecognition')}</h3>
                        <p>{t('landing.patternRecognitionDesc')}</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            {t('landing.duration', { min: '2' })}
                        </span>
                    </div>

                    <div className="feature-card glass-card floating animate-fadeInUp delay-400">
                        <div className="feature-icon-wrapper">
                            <Icon name="language" size={32} animated />
                        </div>
                        <h3>{t('landing.languageTask')}</h3>
                        <p>{t('landing.languageTaskDesc')}</p>
                        <span className="feature-duration">
                            <Icon name="clock" size={14} />
                            {t('landing.duration', { min: '2' })}
                        </span>
                    </div>
                </div>

                <div className="section-header animate-fadeInUp" style={{ marginTop: '1rem', marginBottom: 0 }}>
                    <span className="section-badge">{t('landing.features')}</span>
                </div>
            </section>

            {/* Trust Section */}
            <section className="trust-section container">
                <div className="trust-grid">
                    <div className="trust-card glass-card animate-fadeInUp">
                        <div className="trust-icon">
                            <Icon name="privacy" size={32} animated />
                        </div>
                        <h4>{t('landing.privacyFirst')}</h4>
                        <p>{t('landing.privacyFirstDesc')}</p>
                    </div>
                    <div className="trust-card glass-card animate-fadeInUp delay-100">
                        <div className="trust-icon">
                            <Icon name="evidence" size={32} animated />
                        </div>
                        <h4>{t('landing.evidenceBased')}</h4>
                        <p>{t('landing.evidenceBasedDesc')}</p>
                    </div>
                    <div className="trust-card glass-card animate-fadeInUp delay-200">
                        <div className="trust-icon">
                            <Icon name="notice" size={32} animated />
                        </div>
                        <h4>{t('landing.notDiagnostic')}</h4>
                        <p>{t('landing.notDiagnosticDesc')}</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <p className="footer-brand">
                            <span className="text-gradient">{t('common.vyomflow')}</span>
                        </p>
                        <p className="footer-text">
                            {t('landing.footerText')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
