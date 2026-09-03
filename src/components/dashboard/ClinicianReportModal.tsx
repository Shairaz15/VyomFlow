import React from 'react';
import { Button, Icon } from '../common';
import { CognitiveRadarChart } from './CognitiveRadarChart';
import type { CognitiveModelPrediction } from '../../services/clinicalModelEngine';
import './ClinicianReportModal.css';

export interface ClinicianReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    prediction: CognitiveModelPrediction;
    patientAge: number;
    patientGender: string;
    educationYears: number;
    sessionId?: string;
}

export const ClinicianReportModal: React.FC<ClinicianReportModalProps> = ({
    isOpen,
    onClose,
    prediction,
    patientAge,
    patientGender,
    educationYears,
    sessionId = 'VF-2026-NACC83K',
}) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const riskAttributions = prediction.topAttributions.filter(a => a.impact === 'risk');
    const protectiveAttributions = prediction.topAttributions.filter(a => a.impact === 'protective');

    return (
        <div className="clinician-modal-backdrop" onClick={onClose}>
            <div className="clinician-modal-container" onClick={e => e.stopPropagation()}>
                {/* Modal Top Actions (Hidden in Print) */}
                <div className="clinician-modal-actions no-print">
                    <div className="modal-title-bar">
                        <Icon name="check" size={20} />
                        <h3>Clinician Decision Support Briefing</h3>
                    </div>
                    <div className="action-buttons">
                        <Button variant="secondary" onClick={handlePrint}>
                            <Icon name="chart-trend" size={16} />
                            Print / Save PDF
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="clinician-report-document" id="printable-report">
                    {/* Header */}
                    <div className="report-header">
                        <div className="brand-badge">
                            <h2>VyomFlow Clinical Diagnostics</h2>
                            <p className="subtext">Multi-Task AI Biomarker Screening Report (v2.1)</p>
                        </div>
                        <div className="report-metadata">
                            <p><strong>Session ID:</strong> {sessionId}</p>
                            <p><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            <p><strong>Battery Coverage:</strong> {Math.round(prediction.batteryCoverage * 100)}% ({prediction.completedModules?.length || 6}/6 modules)</p>
                        </div>
                    </div>

                    <hr className="report-divider" />

                    {/* Patient Profile & Primary Diagnostic Finding */}
                    <div className="report-grid-two">
                        <div className="patient-demographics-card">
                            <h4>Patient Profile</h4>
                            <div className="demographics-grid">
                                <div><span className="lbl">Age:</span> {patientAge} yrs</div>
                                <div><span className="lbl">Sex:</span> {patientGender}</div>
                                <div><span className="lbl">Education:</span> {educationYears} yrs</div>
                                <div><span className="lbl">Confidence:</span> {prediction.modelConfidence}%</div>
                            </div>
                        </div>

                        <div className={`diagnostic-summary-card diag-${prediction.predictedDiagnosis.toLowerCase()}`}>
                            <h4>Primary AI Diagnostic Assessment</h4>
                            <div className="diag-badge-container">
                                <span className="diag-badge">{prediction.predictedDiagnosis}</span>
                                <span className="moca-score-pill">
                                    MoCA Est: <strong>{prediction.estimatedMoCA.toFixed(1)}</strong> / 30
                                    <span className="ci-text">(±{prediction.mocaConfidenceInterval} 95% CI)</span>
                                </span>
                            </div>
                            <div className="diag-probabilities">
                                <span>P(Normal): {(prediction.probabilities.normal * 100).toFixed(1)}%</span>
                                <span>P(MCI): {(prediction.probabilities.mci * 100).toFixed(1)}%</span>
                                <span>P(Dementia): {(prediction.probabilities.dementia * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Radar Chart & 6 Domain Sub-Scores */}
                    <div className="report-section">
                        <h4>Multimodal Cognitive Envelope (6 Clinical Domains)</h4>
                        <div className="radar-domain-container">
                            <div className="radar-wrapper">
                                <CognitiveRadarChart
                                    scores={prediction.domainScores}
                                    size={280}
                                    showNormative={true}
                                />
                            </div>
                            <div className="domain-breakdown-list">
                                <div className="domain-row">
                                    <span className="dom-name">🧠 Visual & Verbal Memory</span>
                                    <span className={`dom-val ${prediction.domainScores.memory < 60 ? 'flag-warn' : ''}`}>{prediction.domainScores.memory}/100</span>
                                </div>
                                <div className="domain-row">
                                    <span className="dom-name">🗣️ Language & Speech (CSI)</span>
                                    <span className={`dom-val ${prediction.domainScores.language < 60 ? 'flag-warn' : ''}`}>{prediction.domainScores.language}/100</span>
                                </div>
                                <div className="domain-row">
                                    <span className="dom-name">⚡ Processing Speed (SAVT/WAIS)</span>
                                    <span className={`dom-val ${prediction.domainScores.processingSpeed < 60 ? 'flag-warn' : ''}`}>{prediction.domainScores.processingSpeed}/100</span>
                                </div>
                                <div className="domain-row">
                                    <span className="dom-name">🧩 Executive & Working Memory</span>
                                    <span className={`dom-val ${prediction.domainScores.executive < 60 ? 'flag-warn' : ''}`}>{prediction.domainScores.executive}/100</span>
                                </div>
                                <div className="domain-row">
                                    <span className="dom-name">🗺️ Visuospatial Navigation</span>
                                    <span className={`dom-val ${prediction.domainScores.spatialOrientation < 60 ? 'flag-warn' : ''}`}>{prediction.domainScores.spatialOrientation}/100</span>
                                </div>
                                <div className="domain-row">
                                    <span className="dom-name">🎯 Sustained Attention</span>
                                    <span className={`dom-val ${prediction.domainScores.attention < 60 ? 'flag-warn' : ''}`}>{prediction.domainScores.attention}/100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TreeSHAP Biomarker Attributions */}
                    <div className="report-section">
                        <h4>TreeSHAP Biomarker Key Drivers</h4>
                        <div className="attributions-columns">
                            <div className="attribution-box risk-box">
                                <h5>⚠️ Primary Vulnerability / Risk Factors</h5>
                                {riskAttributions.length === 0 ? (
                                    <p className="no-items">No elevated impairment risk drivers detected.</p>
                                ) : (
                                    <ul>
                                        {riskAttributions.slice(0, 4).map((a, i) => (
                                            <li key={i}>
                                                <strong>{a.featureName.replace(/_/g, ' ')}</strong>: {typeof a.observedValue === 'number' ? a.observedValue.toFixed(2) : a.observedValue}
                                                <div className="attr-desc">{a.domain} domain burden</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="attribution-box protective-box">
                                <h5>🛡️ Preserved Protective Biomarkers</h5>
                                {protectiveAttributions.length === 0 ? (
                                    <p className="no-items">No significant protective markers identified.</p>
                                ) : (
                                    <ul>
                                        {protectiveAttributions.slice(0, 4).map((a, i) => (
                                            <li key={i}>
                                                <strong>{a.featureName.replace(/_/g, ' ')}</strong>: {typeof a.observedValue === 'number' ? a.observedValue.toFixed(2) : a.observedValue}
                                                <div className="attr-desc">{a.domain} intact resilience</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recommendation Tier */}
                    <div className="clinical-recommendation-tier">
                        <p><strong>Clinical Tier Action:</strong> {prediction.clinicalAlertTier.replace(/_/g, ' ')}</p>
                        <p className="disclaimer-text">
                            <em>Notice: This AI-generated screening summary is calibrated against the NACC multi-center cohort (N=83,461) to assist clinical decision making. It does not replace a comprehensive neuropsychological examination.</em>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
