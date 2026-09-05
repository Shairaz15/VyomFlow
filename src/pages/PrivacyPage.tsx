import { PageWrapper } from "../components/layout";
import { Button } from "../components/common";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import {
    ShieldCheck,
    Cpu,
    MicOff,
    Brain,
    WifiOff,
    HeartPulse,
    Database,
    ArrowRight,
    Lock,
    EyeOff,
    Sparkles
} from "lucide-react";
import "./PrivacyPage.css";

export function PrivacyPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <PageWrapper>
            <div className="privacy-page container animate-fadeIn">
                {/* Header */}
                <header className="privacy-header">
                    <div className="privacy-badge-container">
                        <div className="privacy-icon-badge" aria-hidden="true">
                            <ShieldCheck size={26} className="text-[#4F7C78] dark:text-[#5EEAD4]" />
                        </div>
                        <span className="privacy-pill-tag">
                            {t("privacy.badge")}
                        </span>
                    </div>
                    <h1>{t("privacy.title")}</h1>
                    <p className="privacy-subtitle">
                        {t("privacy.subtitle")}
                    </p>
                </header>

                {/* 3-Tier Architecture Architecture Banner */}
                <section className="privacy-architecture-banner">
                    <div className="architecture-banner-header">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} className="text-[#4F7C78] dark:text-[#5EEAD4]" />
                            <h2>{t("privacy.architectureTitle")}</h2>
                        </div>
                        <p>{t("privacy.architectureSubtitle")}</p>
                    </div>

                    <div className="architecture-pipeline">
                        <div className="pipeline-step">
                            <div className="step-badge step-tier1">{t("privacy.pipelineTier1")}</div>
                            <div className="step-icon-wrap">
                                <Cpu size={22} />
                            </div>
                            <div className="step-content">
                                <h4>{t("privacy.pipelineTier1Title")}</h4>
                                <p>{t("privacy.pipelineTier1Desc")}</p>
                            </div>
                            <span className="step-guarantee-pill">{t("privacy.pipelineTier1Guarantee")}</span>
                        </div>

                        <div className="pipeline-arrow" aria-hidden="true">
                            <ArrowRight size={18} />
                        </div>

                        <div className="pipeline-step">
                            <div className="step-badge step-tier2">{t("privacy.pipelineTier2")}</div>
                            <div className="step-icon-wrap">
                                <MicOff size={22} />
                            </div>
                            <div className="step-content">
                                <h4>{t("privacy.pipelineTier2Title")}</h4>
                                <p>{t("privacy.pipelineTier2Desc")}</p>
                            </div>
                            <span className="step-guarantee-pill">{t("privacy.pipelineTier2Guarantee")}</span>
                        </div>

                        <div className="pipeline-arrow" aria-hidden="true">
                            <ArrowRight size={18} />
                        </div>

                        <div className="pipeline-step">
                            <div className="step-badge step-tier3">{t("privacy.pipelineTier3")}</div>
                            <div className="step-icon-wrap">
                                <EyeOff size={22} />
                            </div>
                            <div className="step-content">
                                <h4>{t("privacy.pipelineTier3Title")}</h4>
                                <p>{t("privacy.pipelineTier3Desc")}</p>
                            </div>
                            <span className="step-guarantee-pill">{t("privacy.pipelineTier3Guarantee")}</span>
                        </div>
                    </div>
                </section>

                {/* 6 Key Safeguard Cards */}
                <div className="privacy-grid">
                    {/* 1. Edge Computing */}
                    <div className="privacy-card">
                        <div className="card-top-row">
                            <div className="card-icon-box card-icon-sage" aria-hidden="true">
                                <Cpu size={24} />
                            </div>
                            <span className="card-badge badge-sage">{t("privacy.tier1Badge")}</span>
                        </div>
                        <h3>{t("privacy.tier1Title")}</h3>
                        <p>{t("privacy.tier1Desc")}</p>
                    </div>

                    {/* 2. Ephemeral Audio */}
                    <div className="privacy-card">
                        <div className="card-top-row">
                            <div className="card-icon-box card-icon-blue" aria-hidden="true">
                                <MicOff size={24} />
                            </div>
                            <span className="card-badge badge-blue">{t("privacy.tier2Badge")}</span>
                        </div>
                        <h3>{t("privacy.tier2Title")}</h3>
                        <p>{t("privacy.tier2Desc")}</p>
                    </div>

                    {/* 3. De-Identified Cloud AI */}
                    <div className="privacy-card">
                        <div className="card-top-row">
                            <div className="card-icon-box card-icon-indigo" aria-hidden="true">
                                <Brain size={24} />
                            </div>
                            <span className="card-badge badge-indigo">{t("privacy.tier3Badge")}</span>
                        </div>
                        <h3>{t("privacy.tier3Title")}</h3>
                        <p>{t("privacy.tier3Desc")}</p>
                    </div>

                    {/* 4. Air-Gapped Offline Fallback */}
                    <div className="privacy-card">
                        <div className="card-top-row">
                            <div className="card-icon-box card-icon-gold" aria-hidden="true">
                                <WifiOff size={24} />
                            </div>
                            <span className="card-badge badge-gold">{t("privacy.offlineBadge")}</span>
                        </div>
                        <h3>{t("privacy.offlineTitle")}</h3>
                        <p>{t("privacy.offlineDesc")}</p>
                    </div>

                    {/* 5. Non-Diagnostic Awareness */}
                    <div className="privacy-card">
                        <div className="card-top-row">
                            <div className="card-icon-box card-icon-emerald" aria-hidden="true">
                                <HeartPulse size={24} />
                            </div>
                            <span className="card-badge badge-emerald">{t("privacy.nonDiagnosticBadge")}</span>
                        </div>
                        <h3>{t("privacy.nonDiagnosticTitle")}</h3>
                        <p>{t("privacy.nonDiagnosticDesc")}</p>
                    </div>

                    {/* 6. Data Sovereignty & Erasure */}
                    <div className="privacy-card">
                        <div className="card-top-row">
                            <div className="card-icon-box card-icon-teal" aria-hidden="true">
                                <Database size={24} />
                            </div>
                            <span className="card-badge badge-teal">{t("privacy.dataControlBadge")}</span>
                        </div>
                        <h3>{t("privacy.dataControlTitle")}</h3>
                        <p>{t("privacy.dataControlDesc")}</p>
                    </div>
                </div>

                {/* FAQ Section */}
                <section className="privacy-faq-section">
                    <div className="faq-section-header">
                        <Lock size={22} className="text-[#4F7C78] dark:text-[#5EEAD4]" />
                        <h2>{t("privacy.faqTitle")}</h2>
                    </div>

                    <div className="faq-list">
                        <div className="faq-item">
                            <h4>{t("privacy.faq1Q")}</h4>
                            <p>{t("privacy.faq1A")}</p>
                        </div>

                        <div className="faq-item">
                            <h4>{t("privacy.faq2Q")}</h4>
                            <p>{t("privacy.faq2A")}</p>
                        </div>

                        <div className="faq-item">
                            <h4>{t("privacy.faq3Q")}</h4>
                            <p>{t("privacy.faq3A")}</p>
                        </div>

                        <div className="faq-item">
                            <h4>{t("privacy.faq4Q")}</h4>
                            <p>{t("privacy.faq4A")}</p>
                        </div>
                    </div>
                </section>

                {/* Footer Action */}
                <div className="privacy-actions-footer">
                    <Button variant="primary" size="lg" onClick={() => navigate("/tests")}>
                        {t("privacy.returnToJourney")}
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
}
