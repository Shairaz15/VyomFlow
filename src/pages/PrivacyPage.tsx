import { PageWrapper } from "../components/layout";
import { Icon, Button } from "../components/common";
import { useNavigate } from "react-router-dom";
import "./PrivacyPage.css";

export function PrivacyPage() {
    const navigate = useNavigate();

    return (
        <PageWrapper>
            <div className="privacy-page container animate-fadeIn">
                <header className="privacy-header">
                    <div className="privacy-icon-badge">
                        <Icon name="privacy" size={28} />
                    </div>
                    <h1>Privacy & Data Safeguards</h1>
                    <p className="privacy-subtitle">
                        VyomFlow is designed with privacy-first architecture to protect your personal cognitive health journey.
                    </p>
                </header>

                <div className="privacy-grid">
                    <div className="privacy-card">
                        <div className="card-icon">🧠</div>
                        <h3>Local Audio Processing</h3>
                        <p>
                            Voice features (pause frequency, speech rate, pitch variation) during story recall and language tasks are extracted locally in your browser. Audio streams are discarded after feature computation.
                        </p>
                    </div>

                    <div className="privacy-card">
                        <div className="card-icon">🔐</div>
                        <h3>Encrypted Data Storage</h3>
                        <p>
                            Your assessment results, interaction timings, and longitudinal trend indicators are encrypted during transmission and stored securely with strict account access controls.
                        </p>
                    </div>

                    <div className="privacy-card">
                        <div className="card-icon">🛡️</div>
                        <h3>Personal Health Control</h3>
                        <p>
                            You retain ownership of your assessment records. You can view your full history, export data summaries, or request account deletion at any time.
                        </p>
                    </div>

                    <div className="privacy-card">
                        <div className="card-icon">🩺</div>
                        <h3>Non-Diagnostic & Research-Grade</h3>
                        <p>
                            VyomFlow tracks personal functional patterns over time for wellness and self-awareness. It does not provide medical diagnoses or replace clinical evaluations.
                        </p>
                    </div>
                </div>

                <section className="privacy-faq-section">
                    <h2>Frequently Asked Questions</h2>
                    
                    <div className="faq-item">
                        <h4>Is my raw audio recording stored on server disks?</h4>
                        <p>
                            No. Raw audio captured during spoken activities is processed in browser memory to compute numeric acoustic features. The raw audio buffer is automatically cleared after processing.
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>Are my results shared with third parties or advertisers?</h4>
                        <p>
                            Never. VyomFlow does not sell participant health data or share personal assessment tracking with advertising networks.
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>How can I manage or delete my assessment history?</h4>
                        <p>
                            You can inspect your previous records on the <strong>History</strong> page or manage your account settings from your user profile menu.
                        </p>
                    </div>
                </section>

                <div className="privacy-actions-footer">
                    <Button variant="primary" size="lg" onClick={() => navigate("/tests")}>
                        Return to Journey Map →
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
}
