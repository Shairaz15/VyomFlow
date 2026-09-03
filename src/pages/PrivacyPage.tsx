import { PageWrapper } from "../components/layout";
import { Icon, Button } from "../components/common";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import "./PrivacyPage.css";

export function PrivacyPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <PageWrapper>
            <div className="privacy-page container animate-fadeIn">
                <header className="privacy-header">
                    <div className="privacy-icon-badge">
                        <Icon name="privacy" size={28} />
                    </div>
                    <h1>{t("privacy.title")}</h1>
                    <p className="privacy-subtitle">
                        {t("privacy.subtitle")}
                    </p>
                </header>

                <div className="privacy-grid">
                    <div className="privacy-card">
                        <div className="card-icon-box card-icon-sage" aria-hidden="true">
                            <svg className="custom-privacy-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                                <line x1="8" x2="16" y1="22" y2="22" />
                            </svg>
                        </div>
                        <h3>{t("privacy.localAudioTitle")}</h3>
                        <p>
                            {t("privacy.localAudioDesc")}
                        </p>
                    </div>

                    <div className="privacy-card">
                        <div className="card-icon-box card-icon-blue" aria-hidden="true">
                            <svg className="custom-privacy-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h3>{t("privacy.encryptedStorageTitle")}</h3>
                        <p>
                            {t("privacy.encryptedStorageDesc")}
                        </p>
                    </div>

                    <div className="privacy-card">
                        <div className="card-icon-box card-icon-indigo" aria-hidden="true">
                            <svg className="custom-privacy-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        </div>
                        <h3>{t("privacy.healthControlTitle")}</h3>
                        <p>
                            {t("privacy.healthControlDesc")}
                        </p>
                    </div>

                    <div className="privacy-card">
                        <div className="card-icon-box card-icon-gold" aria-hidden="true">
                            <svg className="custom-privacy-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <h3>{t("privacy.nonDiagnosticTitle")}</h3>
                        <p>
                            {t("privacy.nonDiagnosticDesc")}
                        </p>
                    </div>
                </div>

                <section className="privacy-faq-section">
                    <h2>{t("privacy.faqTitle")}</h2>
                    
                    <div className="faq-item">
                        <h4>{t("privacy.faq1Q")}</h4>
                        <p>
                            {t("privacy.faq1A")}
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>{t("privacy.faq2Q")}</h4>
                        <p>
                            {t("privacy.faq2A")}
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>{t("privacy.faq3Q")}</h4>
                        <p>
                            {t("privacy.faq3A")}
                        </p>
                    </div>
                </section>

                <div className="privacy-actions-footer">
                    <Button variant="primary" size="lg" onClick={() => navigate("/tests")}>
                        {t("privacy.returnToJourney")}
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
}
