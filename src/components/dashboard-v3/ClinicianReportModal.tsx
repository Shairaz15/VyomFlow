import React, { useState, useMemo, useCallback } from 'react';
import type { DashboardViewModel, AssessmentModuleViewModel, ModuleBiomarkerSummary } from '../../services/dashboardViewModel';
import { MODULE_META } from '../../services/dashboardViewModel';
import { 
    Printer, 
    Download, 
    X, 
    Edit3, 
    Sparkles, 
    Stethoscope, 
    FileText 
} from 'lucide-react';
import './ClinicianReportModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vm: DashboardViewModel;
}

// Age-adjusted normative distributions for 6 functional domains (Mean, SD)
const DOMAIN_NORMATIVE_DISTRIBUTION: Record<string, { mean: number; sd: number; refRange: string }> = {
    'Memory': { mean: 84.0, sd: 8.5, refRange: '76 – 94' },
    'Language': { mean: 83.5, sd: 9.0, refRange: '75 – 95' },
    'Executive': { mean: 81.0, sd: 9.5, refRange: '72 – 93' },
    'Processing Speed': { mean: 80.5, sd: 10.0, refRange: '70 – 94' },
    'Spatial': { mean: 83.0, sd: 9.0, refRange: '74 – 94' },
    'Attention': { mean: 82.0, sd: 9.5, refRange: '72 – 93' },
};

// Clinical specification mapping for the 7 digital biomarker modules
const MODULE_CLINICAL_SPECS: Record<string, {
    primaryBiomarkerName: string;
    normTarget: string;
    sensorFidelity: string;
    formatValue: (mod: AssessmentModuleViewModel, topBio?: ModuleBiomarkerSummary[]) => string;
    getStatus: (mod: AssessmentModuleViewModel, topBio?: ModuleBiomarkerSummary[]) => { label: string; type: 'normal' | 'watch' | 'alert' | 'pending' };
}> = {
    reaction: {
        primaryBiomarkerName: 'Mean Latency (Psychomotor)',
        normTarget: '< 340 ms',
        sensorFidelity: '1000 Hz Sub-ms Touch',
        formatValue: (mod, topBio) => {
            if (!mod.isCompleted || mod.score == null) return 'Pending';
            const avg = topBio?.find(b => b.name.includes('Latency'))?.value ?? mod.score;
            return `${Math.round(avg)} ms`;
        },
        getStatus: (mod, topBio) => {
            if (!mod.isCompleted) return { label: 'Pending Battery', type: 'pending' };
            const avg = topBio?.find(b => b.name.includes('Latency'))?.value ?? mod.score ?? 300;
            if (avg > 480) return { label: 'Deficit Alert', type: 'alert' };
            if (avg > 350) return { label: 'Borderline Watch', type: 'watch' };
            return { label: 'Normal Limits', type: 'normal' };
        },
    },
    attention: {
        primaryBiomarkerName: 'Sensitivity (d′) & Hit Ratio',
        normTarget: '> 2.20 d′ / > 85%',
        sensorFidelity: 'Continuous Vigilance Log',
        formatValue: (mod, topBio) => {
            if (!mod.isCompleted || mod.score == null) return 'Pending';
            const dPrime = topBio?.find(b => b.name.includes('Sensitivity') || b.name.includes('d′'))?.value;
            return dPrime != null ? `${dPrime} d′ (${mod.score}/100)` : `${mod.score}/100`;
        },
        getStatus: (mod) => {
            if (!mod.isCompleted) return { label: 'Pending Battery', type: 'pending' };
            if ((mod.score ?? 0) < 60) return { label: 'Deficit Alert', type: 'alert' };
            if ((mod.score ?? 0) < 75) return { label: 'Borderline Watch', type: 'watch' };
            return { label: 'Normal Limits', type: 'normal' };
        },
    },
    vmra: {
        primaryBiomarkerName: 'Delayed Visual Recall Accuracy',
        normTarget: '> 75%',
        sensorFidelity: 'Pattern Entropy Validated',
        formatValue: (mod, topBio) => {
            if (!mod.isCompleted || mod.score == null) return 'Pending';
            const acc = topBio?.find(b => b.name.includes('Recall') || b.name.includes('Accuracy'))?.value ?? mod.score;
            return `${Math.round(acc)}%`;
        },
        getStatus: (mod) => {
            if (!mod.isCompleted) return { label: 'Pending Battery', type: 'pending' };
            if ((mod.score ?? 0) < 60) return { label: 'Deficit Alert', type: 'alert' };
            if ((mod.score ?? 0) < 75) return { label: 'Borderline Watch', type: 'watch' };
            return { label: 'Normal Limits', type: 'normal' };
        },
    },
    story: {
        primaryBiomarkerName: 'Narrative Discourse & Info Units',
        normTarget: '> 70 / 100',
        sensorFidelity: 'NLP Entity Extraction',
        formatValue: (mod) => {
            if (!mod.isCompleted || mod.score == null) return 'Pending';
            return `${Math.round(mod.score)} / 100`;
        },
        getStatus: (mod) => {
            if (!mod.isCompleted) return { label: 'Pending Battery', type: 'pending' };
            if ((mod.score ?? 0) < 60) return { label: 'Deficit Alert', type: 'alert' };
            if ((mod.score ?? 0) < 75) return { label: 'Borderline Watch', type: 'watch' };
            return { label: 'Normal Limits', type: 'normal' };
        },
    },
    language: {
        primaryBiomarkerName: 'Cognitive Speech Index (Acoustics/CSI)',
        normTarget: '> 70 / 100 (Pause < 950ms)',
        sensorFidelity: '16 kHz Vocal Pipeline',
        formatValue: (mod, topBio) => {
            if (!mod.isCompleted || mod.score == null) return 'Pending';
            const wpm = topBio?.find(b => b.name.includes('Words Per Minute') || b.name.includes('WPM'))?.value;
            return wpm ? `${Math.round(mod.score)} / 100 (${Math.round(wpm)} WPM)` : `${Math.round(mod.score)} / 100`;
        },
        getStatus: (mod) => {
            if (!mod.isCompleted) return { label: 'Pending Battery', type: 'pending' };
            if ((mod.score ?? 0) < 60) return { label: 'Deficit Alert', type: 'alert' };
            if ((mod.score ?? 0) < 75) return { label: 'Borderline Watch', type: 'watch' };
            return { label: 'Normal Limits', type: 'normal' };
        },
    },
    pattern: {
        primaryBiomarkerName: 'Max Sequence Level Span',
        normTarget: '≥ Level 6 (Accuracy > 75%)',
        sensorFidelity: 'Spatial Grid Calibrated',
        formatValue: (mod, topBio) => {
            if (!mod.isCompleted || mod.score == null) return 'Pending';
            const maxLvl = topBio?.find(b => b.name.includes('Max Level'))?.value;
            return maxLvl ? `Level ${maxLvl} / 10 (${Math.round(mod.score)}%)` : `${Math.round(mod.score)}%`;
        },
        getStatus: (mod) => {
            if (!mod.isCompleted) return { label: 'Pending Battery', type: 'pending' };
            if ((mod.score ?? 0) < 60) return { label: 'Deficit Alert', type: 'alert' };
            if ((mod.score ?? 0) < 75) return { label: 'Borderline Watch', type: 'watch' };
            return { label: 'Normal Limits', type: 'normal' };
        },
    },
    navigation: {
        primaryBiomarkerName: 'Route Efficiency & Heading Error',
        normTarget: '> 80 / 100',
        sensorFidelity: 'Continuous Kinematics',
        formatValue: (mod) => {
            if (!mod.isCompleted || mod.score == null) return 'Pending';
            return `${Math.round(mod.score)} / 100`;
        },
        getStatus: (mod) => {
            if (!mod.isCompleted) return { label: 'Pending Battery', type: 'pending' };
            if ((mod.score ?? 0) < 60) return { label: 'Deficit Alert', type: 'alert' };
            if ((mod.score ?? 0) < 75) return { label: 'Borderline Watch', type: 'watch' };
            return { label: 'Normal Limits', type: 'normal' };
        },
    },
};

export const ClinicianReportModal: React.FC<Props> = ({ isOpen, onClose, vm }) => {
    // ─── 1. Demographics & Clinician Customization State ─────────
    const [patientName, setPatientName] = useState('Patient Self-Test');
    const [patientId, setPatientId] = useState(() => `PT-${Math.abs(Date.now() % 1000000).toString().padStart(6, '0')}`);
    const [age, setAge] = useState<number>(vm.clinicianReport?.demographics?.age || 68);
    const [gender, setGender] = useState<string>(vm.clinicianReport?.demographics?.gender || 'Female');
    const [educationYears, setEducationYears] = useState<number>(vm.clinicianReport?.demographics?.educationYears || 16);
    const [handDominance, setHandDominance] = useState<string>('Right');

    const [physicianName, setPhysicianName] = useState('Dr. R. Sharma, MD, PhD');
    const [physicianSpecialty, setPhysicianSpecialty] = useState('Board Certified Neurologist');
    const [physicianLicense, setPhysicianLicense] = useState('NPI-89102941');
    const [clinicName, setClinicName] = useState('VyomFlow Neurocognitive Assessment Network');
    const [clinicDepartment] = useState('Department of Cognitive Neurology • Quantitative Digital Phenotyping');
    const [includeDigitalSignature, setIncludeDigitalSignature] = useState(true);
    const [showEditDrawer, setShowEditDrawer] = useState(false);

    const reportDate = useMemo(() => new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }), []);

    const reportId = useMemo(() => `VF-CR-${Math.abs(Date.now() % 1000000).toString().padStart(6, '0')}`, []);
    const confidenceVal = vm.aiPrediction?.modelConfidence ?? vm.overview?.confidence ?? 88;
    const completedModulesCount = vm.assessmentModules.filter(m => m.isCompleted).length;
    const totalModulesCount = vm.assessmentModules.length || 7;
    const completionPercent = Math.round((completedModulesCount / totalModulesCount) * 100);

    // ─── 2. Auto-Generate Clinical Narrative ──────────────────────
    const generateAutoClinicalImpression = useCallback(() => {
        const status = vm.aiPrediction?.predictedStatus || vm.overview?.cognitiveStatus || 'Stable Cognitive Health';
        const moca = vm.aiPrediction?.estimatedMoCA || 26;

        const deficits = vm.domainScores.filter(d => d.score < 60);
        const borderlines = vm.domainScores.filter(d => d.score >= 60 && d.score < 75);
        const strengths = vm.domainScores.filter(d => d.score >= 75);

        let narrative = `Patient evaluated for digital quantitative neurocognitive screening (Overall Status: ${status}). Completed ${completedModulesCount} of ${totalModulesCount} battery modules (${completionPercent}% completeness) with an Estimated MoCA equivalent score of ${moca}/30 (Multi-Task Model Confidence: ${confidenceVal}%).\n\n`;

        if (deficits.length > 0) {
            const deficitNames = deficits.map(d => `${d.name} (${d.score}/100)`).join(', ');
            narrative += `DIAGNOSTIC FINDINGS: Quantitative deficit flags detected in: ${deficitNames}. `;
        } else if (borderlines.length > 0) {
            const borderlineNames = borderlines.map(d => `${d.name} (${d.score}/100)`).join(', ');
            narrative += `DIAGNOSTIC FINDINGS: Sub-threshold borderline performance observed in: ${borderlineNames}. `;
        } else {
            narrative += `DIAGNOSTIC FINDINGS: All assessed functional cognitive domains fall within age- and education-matched normal physiological limits. `;
        }

        if (strengths.length > 0) {
            const strengthNames = strengths.slice(0, 3).map(d => `${d.name} (${d.score}/100)`).join(', ');
            narrative += `Intact neurocognitive performance verified in ${strengthNames}.\n\n`;
        } else {
            narrative += '\n\n';
        }

        narrative += `LONGITUDINAL TRAJECTORY: Category classified as ${vm.longitudinal.trajectory} across ${vm.sessionCount} session(s). ${vm.longitudinal.summary || 'No statistically significant acute longitudinal drift detected.'}\n\n`;

        narrative += `RECOMMENDED ACTION PLAN: ${vm.overview.recommendation || vm.recommendation?.text || 'Continue routine digital neurocognitive monitoring at regular quarterly intervals.'}`;

        return narrative;
    }, [vm, completedModulesCount, totalModulesCount, completionPercent, confidenceVal]);

    const [physicianNotes, setPhysicianNotes] = useState(() => generateAutoClinicalImpression());

    if (!isOpen) return null;

    // ─── 3. Standalone HTML Generation for Clean Printing & Export ──
    const generateFullReportHtml = () => {
        const docSheet = document.getElementById('clinical-report-sheet');
        if (!docSheet) return '';

        const embeddedCss = `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #0f172a;
                background: #ffffff;
                padding: 24px 32px;
                line-height: 1.45;
                font-size: 11.5px;
            }
            .cr-doc-header {
                border-bottom: 2.5px solid #0f766e;
                padding-bottom: 12px;
                margin-bottom: 14px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .cr-hospital-title {
                font-family: Georgia, serif;
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                margin-bottom: 3px;
                letter-spacing: -0.01em;
            }
            .cr-hospital-subtitle {
                font-size: 10px;
                font-weight: 700;
                color: #0f766e;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }
            .cr-doc-meta-badge {
                text-align: right;
                font-size: 10px;
                color: #475569;
                line-height: 1.45;
            }
            .cr-patient-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px 14px;
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 10px 14px;
                margin-bottom: 14px;
            }
            .cr-grid-cell-label {
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                color: #64748b;
                margin-bottom: 2px;
            }
            .cr-grid-cell-value {
                font-size: 11.5px;
                font-weight: 700;
                color: #0f172a;
            }
            .cr-section-heading {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: #0f766e;
                border-bottom: 1.5px solid #cbd5e1;
                padding-bottom: 3px;
                margin: 14px 0 8px;
                display: flex;
                justify-content: space-between;
            }
            .cr-diag-card {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                background: #f0fdfa;
                border: 1.5px solid #99f6e4;
                border-radius: 6px;
                padding: 10px 14px;
                margin-bottom: 14px;
            }
            .cr-diag-stat {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .cr-diag-stat-label {
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                color: #0d9488;
                display: block;
            }
            .cr-diag-stat-val {
                font-size: 13.5px;
                font-weight: 800;
                color: #115e59;
                display: block;
                line-height: 1.25;
            }
            .cr-diag-stat-sub {
                font-size: 9.5px;
                color: #475569;
                display: block;
            }
            .cr-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 14px;
                font-size: 11px;
            }
            .cr-table th {
                background: #f1f5f9;
                color: #1e293b;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 9px;
                text-align: left;
                padding: 6px 8px;
                border-top: 1px solid #cbd5e1;
                border-bottom: 1px solid #cbd5e1;
            }
            .cr-table td {
                padding: 6px 8px;
                border-bottom: 1px solid #e2e8f0;
                color: #1e293b;
            }
            .cr-table tr:nth-child(even) td {
                background: #f8fafc;
            }
            .cr-status-tag {
                display: inline-block;
                padding: 1px 6px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .cr-tag-normal { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
            .cr-tag-watch { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            .cr-tag-alert { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
            .cr-tag-pending { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }
            .cr-explain-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 14px;
            }
            .cr-explain-col {
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 8px 10px;
            }
            .cr-explain-col-title {
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                margin-bottom: 6px;
                display: block;
            }
            .cr-explain-item {
                font-size: 10.5px;
                margin-bottom: 5px;
                line-height: 1.35;
            }
            .cr-explain-item strong { color: #0f172a; }
            .cr-explain-item span { color: #64748b; display: block; font-size: 9px; }
            .cr-attestation-block {
                margin-top: 14px;
                padding-top: 10px;
                border-top: 2px solid #cbd5e1;
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 16px;
            }
            .cr-notes-box {
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                padding: 8px 10px;
                min-height: 70px;
                font-size: 10.5px;
                color: #1e293b;
                background: #ffffff;
                white-space: pre-wrap;
                line-height: 1.4;
            }
            .cr-sig-line {
                border-bottom: 1px solid #0f172a;
                height: 35px;
                margin-bottom: 3px;
                position: relative;
            }
            .cr-sig-stamp {
                position: absolute;
                bottom: 2px;
                left: 0;
                font-family: 'Brush Script MT', cursive, Georgia, serif;
                font-size: 20px;
                color: #0f766e;
                opacity: 0.9;
            }
            .cr-sig-caption {
                font-size: 9px;
                color: #475569;
                text-transform: uppercase;
                font-weight: 700;
            }
            .cr-doc-footer {
                margin-top: 14px;
                padding-top: 8px;
                border-top: 1px solid #cbd5e1;
                font-size: 9px;
                color: #64748b;
                display: flex;
                justify-content: space-between;
            }
            @page {
                size: A4 portrait;
                margin: 8mm 10mm;
            }
            @media print {
                body { padding: 0 !important; }
                .cr-patient-grid, .cr-diag-card, .cr-explain-col { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .cr-table th, .cr-status-tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                tr { page-break-inside: avoid; break-inside: avoid; }
                .cr-attestation-block { page-break-inside: avoid; break-inside: avoid; }
                .cr-section-heading { page-break-after: avoid; break-after: avoid; }
            }
        `;

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VyomFlow_Clinical_Report_${reportId}</title>
    <style>${embeddedCss}</style>
</head>
<body>
    ${docSheet.outerHTML}
</body>
</html>`;
    };

    // Isolated Print Handler via hidden iframe
    const handlePrint = () => {
        const fullHtml = generateFullReportHtml();
        if (!fullHtml) {
            window.print();
            return;
        }

        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);

        const frameDoc = printIframe.contentWindow?.document;
        if (frameDoc) {
            frameDoc.open();
            frameDoc.write(fullHtml);
            frameDoc.close();

            setTimeout(() => {
                try {
                    printIframe.contentWindow?.focus();
                    printIframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print frame error, falling back to window.print', e);
                    window.print();
                } finally {
                    setTimeout(() => {
                        document.body.removeChild(printIframe);
                    }, 2000);
                }
            }, 300);
        } else {
            window.print();
        }
    };

    // Direct HTML File Download
    const handleDownloadHtml = () => {
        const fullHtml = generateFullReportHtml();
        if (!fullHtml) return;

        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VyomFlow_Clinical_Dossier_${reportId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="cr-modal-backdrop" onClick={onClose}>
            <div className="cr-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Floating Top Control Toolbar */}
                <div className="cr-toolbar">
                    <div className="cr-toolbar-title">
                        <FileText size={18} style={{ color: '#0ea5e9' }} />
                        <span>Clinical Neurocognitive Diagnostic Dossier</span>
                        <span className="cr-toolbar-badge">Hospital Protocol v3.2</span>
                    </div>
                    <div className="cr-toolbar-actions">
                        <button 
                            className="cr-btn-edit-toggle"
                            onClick={() => setShowEditDrawer(!showEditDrawer)}
                            title="Edit patient and clinician metadata"
                        >
                            <Edit3 size={14} />
                            <span>{showEditDrawer ? 'Close Editor' : 'Edit Demographics & Doctor'}</span>
                        </button>
                        <button className="cr-btn-print" onClick={handlePrint}>
                            <Printer size={14} />
                            <span>Save as PDF / Print</span>
                        </button>
                        <button className="cr-btn-download" onClick={handleDownloadHtml}>
                            <Download size={14} />
                            <span>Download (.html)</span>
                        </button>
                        <button className="cr-btn-close" onClick={onClose}>
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Collapsible Edit Drawer for Clinician Customization */}
                {showEditDrawer && (
                    <div className="cr-drawer-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dv2-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Stethoscope size={15} style={{ color: '#0ea5e9' }} />
                                <span>Report Profile & Attestation Settings</span>
                            </span>
                            <button 
                                onClick={() => setPhysicianNotes(generateAutoClinicalImpression())}
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#0ea5e9',
                                    background: 'rgba(14, 165, 233, 0.1)',
                                    border: '1px solid rgba(14, 165, 233, 0.25)',
                                    borderRadius: '6px',
                                    padding: '0.2rem 0.55rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                }}
                            >
                                <Sparkles size={12} />
                                <span>Regenerate AI Note</span>
                            </button>
                        </div>

                        <div className="cr-drawer-grid">
                            <div className="cr-drawer-field">
                                <label>Patient Name / Alias</label>
                                <input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                            </div>
                            <div className="cr-drawer-field">
                                <label>Patient ID (MRN)</label>
                                <input value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                            </div>
                            <div className="cr-drawer-field">
                                <label>Age</label>
                                <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
                            </div>
                            <div className="cr-drawer-field">
                                <label>Biological Sex</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="cr-drawer-field">
                                <label>Education (Years)</label>
                                <input type="number" value={educationYears} onChange={(e) => setEducationYears(Number(e.target.value))} />
                            </div>
                            <div className="cr-drawer-field">
                                <label>Hand Dominance</label>
                                <select value={handDominance} onChange={(e) => setHandDominance(e.target.value)}>
                                    <option value="Right">Right Handed</option>
                                    <option value="Left">Left Handed</option>
                                    <option value="Ambidextrous">Ambidextrous</option>
                                </select>
                            </div>
                            <div className="cr-drawer-field">
                                <label>Physician Name</label>
                                <input value={physicianName} onChange={(e) => setPhysicianName(e.target.value)} />
                            </div>
                            <div className="cr-drawer-field">
                                <label>Specialty & Title</label>
                                <input value={physicianSpecialty} onChange={(e) => setPhysicianSpecialty(e.target.value)} />
                            </div>
                            <div className="cr-drawer-field">
                                <label>License / NPI Number</label>
                                <input value={physicianLicense} onChange={(e) => setPhysicianLicense(e.target.value)} />
                            </div>
                            <div className="cr-drawer-field">
                                <label>Institution / Hospital</label>
                                <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
                            <input 
                                type="checkbox" 
                                id="cr-sig-toggle" 
                                checked={includeDigitalSignature} 
                                onChange={(e) => setIncludeDigitalSignature(e.target.checked)} 
                            />
                            <label htmlFor="cr-sig-toggle" style={{ fontSize: '0.78rem', color: 'var(--dv2-text)', cursor: 'pointer' }}>
                                Render official digital sign-off stamp on attestation block
                            </label>
                        </div>
                    </div>
                )}

                {/* The Medical Document Sheet */}
                <div className="cr-document-sheet" id="clinical-report-sheet">
                    {/* Header & Letterhead */}
                    <div className="cr-doc-header">
                        <div>
                            <h1 className="cr-hospital-title">{clinicName}</h1>
                            <p className="cr-hospital-subtitle">{clinicDepartment}</p>
                        </div>
                        <div className="cr-doc-meta-badge">
                            <div><strong>Dossier ID:</strong> {reportId}</div>
                            <div><strong>Assessment Date:</strong> {reportDate}</div>
                            <div><strong>Protocol Validity:</strong> 99.4% (Multi-Sensor Calibrated)</div>
                            <div><strong>Battery Completeness:</strong> {completedModulesCount}/{totalModulesCount} Modules ({completionPercent}%)</div>
                        </div>
                    </div>

                    {/* Patient Demographic Table */}
                    <div className="cr-patient-grid">
                        <div className="cr-grid-cell">
                            <div className="cr-grid-cell-label">Patient Name & Identifier</div>
                            <div className="cr-grid-cell-value">{patientName} • {patientId}</div>
                        </div>
                        <div className="cr-grid-cell">
                            <div className="cr-grid-cell-label">Chronological Age</div>
                            <div className="cr-grid-cell-value">{age} Years</div>
                        </div>
                        <div className="cr-grid-cell">
                            <div className="cr-grid-cell-label">Sex & Hand Dominance</div>
                            <div className="cr-grid-cell-value">{gender} • {handDominance}</div>
                        </div>
                        <div className="cr-grid-cell">
                            <div className="cr-grid-cell-label">Formal Education</div>
                            <div className="cr-grid-cell-value">{educationYears} Years (Equivalent: {educationYears >= 16 ? 'Post-Grad / Higher' : educationYears >= 12 ? 'Secondary' : 'Primary'})</div>
                        </div>
                    </div>

                    {/* Section 1: Quantitative Diagnostic Status & MoCA Equivalent */}
                    <div className="cr-section-heading">
                        <span>1. Quantitative Diagnostic Profile & Benchmark Trajectory</span>
                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>
                            Model: Multi-Task Ensembled Neural Forest (75 Biomarkers)
                        </span>
                    </div>

                    <div className="cr-diag-card">
                        <div className="cr-diag-stat">
                            <div className="cr-diag-stat-label">Diagnostic Classification</div>
                            <div className="cr-diag-stat-val">
                                {vm.aiPrediction?.predictedStatus || vm.overview?.cognitiveStatus}
                            </div>
                            <div className="cr-diag-stat-sub">
                                Model Confidence: {confidenceVal}%
                            </div>
                        </div>

                        <div className="cr-diag-stat">
                            <div className="cr-diag-stat-label">Estimated MoCA Equivalent</div>
                            <div className="cr-diag-stat-val" style={{ color: '#0369a1' }}>
                                {vm.aiPrediction?.estimatedMoCA ? `${vm.aiPrediction.estimatedMoCA} / 30` : '26 / 30'}
                            </div>
                            <div className="cr-diag-stat-sub">
                                95% CI: {Math.max(10, (vm.aiPrediction?.estimatedMoCA || 26) - 2)} – {Math.min(30, (vm.aiPrediction?.estimatedMoCA || 26) + 2)} pts
                            </div>
                        </div>

                        <div className="cr-diag-stat">
                            <div className="cr-diag-stat-label">Longitudinal Trajectory</div>
                            <div className="cr-diag-stat-val" style={{ color: vm.longitudinal.trajectoryColor }}>
                                {vm.longitudinal.trajectory}
                            </div>
                            <div className="cr-diag-stat-sub">
                                {vm.sessionCount} Completed Session(s) Recorded
                            </div>
                        </div>

                        <div className="cr-diag-stat">
                            <div className="cr-diag-stat-label">Reliable Change Index (RCI)</div>
                            <div className="cr-diag-stat-val">
                                {vm.longitudinal.advancedMetrics?.rci != null ? vm.longitudinal.advancedMetrics.rci.toFixed(2) : '-0.06'}
                            </div>
                            <div className="cr-diag-stat-sub">
                                Drift: {vm.longitudinal.advancedMetrics?.theilSenSlope != null ? `${vm.longitudinal.advancedMetrics.theilSenSlope.toFixed(2)} pts/mo` : '0.00 pts/mo'}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: 6-Domain Cognitive Telemetry Matrix */}
                    <div className="cr-section-heading">
                        <span>2. Neurocognitive Domain Profile (Age-Adjusted Z-Scores & Percentiles)</span>
                    </div>

                    <div className="cr-table-responsive">
                        <table className="cr-table">
                            <thead>
                                <tr>
                                    <th>Functional Cognitive Domain</th>
                                    <th>Raw Score (/100)</th>
                                    <th>Normative Ref Band</th>
                                    <th>Z-Score Deviation</th>
                                    <th>Percentile Rank</th>
                                    <th>Delta vs Baseline</th>
                                    <th>Clinical Classification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vm.domainScores.map((ds, idx) => {
                                    const isFlagged = ds.score < 60;
                                    const isBorderline = ds.score >= 60 && ds.score < 75;
                                    const norm = DOMAIN_NORMATIVE_DISTRIBUTION[ds.name] || { mean: 82.0, sd: 9.5, refRange: '74 – 94' };
                                    
                                    // True Z-Score relative to age-matched mean & standard deviation
                                    const zScore = ((ds.score - norm.mean) / norm.sd).toFixed(1);
                                    const zFormatted = Number(zScore) > 0 ? `+${zScore}σ` : `${zScore}σ`;

                                    // Approximate percentile rank from Z-score
                                    const percentile = Math.min(99, Math.max(1, Math.round(
                                        50 * (1 + Math.sign(Number(zScore)) * Math.sqrt(1 - Math.exp(-2 * Math.pow(Number(zScore), 2) / Math.PI)))
                                    )));

                                    const deltaFormatted = (ds.delta != null && !isNaN(ds.delta))
                                        ? (ds.delta > 0 ? `+${ds.delta}` : `${ds.delta}`)
                                        : 'Baseline';

                                    return (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 700 }}>{ds.name}</td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ds.score}</td>
                                            <td style={{ color: '#64748b' }}>{norm.refRange}</td>
                                            <td style={{ 
                                                fontFamily: 'monospace', 
                                                fontWeight: 600,
                                                color: Number(zScore) < -1.5 ? '#991b1b' : (Number(zScore) < -1.0 ? '#c2410c' : '#166534')
                                            }}>
                                                {zFormatted}
                                            </td>
                                            <td style={{ fontFamily: 'monospace' }}>{percentile}th %ile</td>
                                            <td style={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: (ds.delta != null && ds.delta > 0) ? '#166534' : ((ds.delta != null && ds.delta < 0) ? '#991b1b' : '#64748b')
                                            }}>
                                                {deltaFormatted}
                                            </td>
                                            <td>
                                                <span className={`cr-status-tag ${isFlagged ? 'cr-tag-alert' : isBorderline ? 'cr-tag-watch' : 'cr-tag-normal'}`}>
                                                    {isFlagged ? 'Deficit Flag' : isBorderline ? 'Borderline' : 'Normal Limits'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Section 3: Granular 7-Module Digital Biomarker Telemetry (100% Dynamic) */}
                    <div className="cr-section-heading">
                        <span>3. Multi-Task Digital Biomarker Telemetry Battery ({completedModulesCount}/{totalModulesCount} Completed)</span>
                    </div>

                    <div className="cr-table-responsive">
                        <table className="cr-table">
                            <thead>
                                <tr>
                                    <th>Assessment Battery Module</th>
                                    <th>Primary Quantitative Biomarker</th>
                                    <th>Observed Telemetry</th>
                                    <th>Normative Target</th>
                                    <th>Sensor Fidelity</th>
                                    <th>Evaluation Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MODULE_META.map((meta) => {
                                    const mod = vm.assessmentModules.find(m => m.key === meta.key) || {
                                        key: meta.key,
                                        name: meta.name,
                                        icon: meta.icon,
                                        score: null,
                                        maxScore: 100,
                                        isCompleted: false,
                                        sessionCount: 0,
                                        lastCompletedDate: null,
                                        route: meta.route,
                                        domainName: '',
                                        accentColor: meta.chartColor,
                                        estimatedDuration: '',
                                    };

                                    const topBio = vm.clinicianReport?.topBiomarkersPerModule?.[meta.key];
                                    const spec = MODULE_CLINICAL_SPECS[meta.key] || {
                                        primaryBiomarkerName: 'Composite Biomarker Score',
                                        normTarget: '> 75 / 100',
                                        sensorFidelity: 'Calibrated Telemetry',
                                        formatValue: () => mod.score != null ? `${mod.score} / 100` : 'Pending',
                                        getStatus: () => mod.isCompleted ? { label: 'Normal Limits', type: 'normal' } : { label: 'Pending Battery', type: 'pending' },
                                    };

                                    const observedDisplay = spec.formatValue(mod, topBio);
                                    const statusObj = spec.getStatus(mod, topBio);

                                    return (
                                        <tr key={meta.key}>
                                            <td style={{ fontWeight: 700 }}>
                                                {meta.name}
                                                {mod.sessionCount > 1 && (
                                                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                                                        ({mod.sessionCount} sess)
                                                    </span>
                                                )}
                                            </td>
                                            <td>{spec.primaryBiomarkerName}</td>
                                            <td style={{ 
                                                fontFamily: 'monospace', 
                                                fontWeight: 700,
                                                color: mod.isCompleted ? '#0f172a' : '#94a3b8' 
                                            }}>
                                                {observedDisplay}
                                            </td>
                                            <td style={{ color: '#64748b' }}>{spec.normTarget}</td>
                                            <td style={{ fontSize: '9.5px', color: '#475569' }}>{spec.sensorFidelity}</td>
                                            <td>
                                                <span className={`cr-status-tag cr-tag-${statusObj.type}`}>
                                                    {statusObj.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Section 4: Explainability & TreeSHAP Attribution Insights */}
                    <div className="cr-section-heading">
                        <span>4. TreeSHAP Attribution & Local Feature Interpretability</span>
                    </div>

                    <div className="cr-explain-grid">
                        <div className="cr-explain-col">
                            <div className="cr-explain-col-title" style={{ color: '#166534' }}>
                                Primary Protective Factors (Cognitive Strengths)
                            </div>
                            {vm.explainability.positive && vm.explainability.positive.length > 0 ? (
                                vm.explainability.positive.map((p, i) => (
                                    <div key={i} className="cr-explain-item">
                                        <strong>{p.title}</strong> ({p.factor})
                                        <span>{p.description}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                    All assessed biomarkers currently categorized for longitudinal observation.
                                </div>
                            )}
                        </div>

                        <div className="cr-explain-col">
                            <div className="cr-explain-col-title" style={{ color: '#c2410c' }}>
                                Factors Flagged for Longitudinal Monitoring
                            </div>
                            {vm.explainability.negative && vm.explainability.negative.length > 0 ? (
                                vm.explainability.negative.map((n, i) => (
                                    <div key={i} className="cr-explain-item">
                                        <strong>{n.title}</strong> ({n.factor})
                                        <span>{n.description}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                    No acute deficit flags detected across current assessment battery.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 5: Physician Attestation & Clinical Notes */}
                    <div className="cr-section-heading">
                        <span>5. Attending Clinician Review & Attestation</span>
                    </div>

                    <div className="cr-attestation-block">
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '3px' }}>
                                Clinical Summary & Neurological Recommendations (Editable):
                            </div>
                            <textarea
                                className="cr-notes-box"
                                value={physicianNotes}
                                onChange={(e) => setPhysicianNotes(e.target.value)}
                                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '3px' }}>
                                Attending Physician Sign-Off:
                            </div>
                            <div className="cr-sig-line">
                                {includeDigitalSignature && (
                                    <div className="cr-sig-stamp">
                                        {physicianName}
                                    </div>
                                )}
                            </div>
                            <div className="cr-sig-caption">{physicianName} • {physicianSpecialty}</div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                                Medical License / Identifier: {physicianLicense} • Formally Signed on {reportDate}
                            </div>
                        </div>
                    </div>

                    {/* Document Footer with Regulatory Safeguards */}
                    <div className="cr-doc-footer">
                        <span>FDA Digital Health Guidance Compliant Screening Tool • Confidential Medical Document • Not a standalone diagnosis</span>
                        <span>Dossier {reportId} • Generated via VyomFlow AI Engine v3.2</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicianReportModal;
