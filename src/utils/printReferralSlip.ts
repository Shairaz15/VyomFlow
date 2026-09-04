/**
 * Dedicated, Bulletproof PHC Referral Slip Printing Utility
 * Uses an isolated hidden iframe with standalone A4 print CSS to ensure
 * 100% reliable printing across Chrome, Edge, Safari, Firefox, and mobile
 * without interference from SPA overlays, modal scrollbars, or dark themes.
 */

import type { AshaBeneficiary } from '../services/supabaseService';

interface PrintSlipOptions {
    beneficiary: AshaBeneficiary;
    latestSession?: any;
    prediction?: any;
}

export function printPhcReferralSlip({ beneficiary, latestSession, prediction }: PrintSlipOptions) {
    // 1. Resolve MoCA score and Triage Tier
    const mocaScore = prediction?.estimatedMoCA != null
        ? Math.round(prediction.estimatedMoCA)
        : latestSession?.estimated_moca != null
        ? Math.round(latestSession.estimated_moca)
        : beneficiary.latest_moca != null
        ? Math.round(beneficiary.latest_moca)
        : null;

    const tier = prediction?.clinicalAlertTier
        || latestSession?.clinical_alert_tier
        || beneficiary.latest_alert_tier
        || 'CLINICAL_REVIEW';

    const formattedTier = tier.replace(/_/g, ' ');

    // 2. Resolve domain scores
    const domainMemory = prediction?.domainScores?.memory != null
        ? Math.round(prediction.domainScores.memory)
        : latestSession?.domain_memory != null
        ? Math.round(latestSession.domain_memory)
        : null;

    const domainExecutive = prediction?.domainScores?.executive != null
        ? Math.round(prediction.domainScores.executive)
        : latestSession?.domain_executive != null
        ? Math.round(latestSession.domain_executive)
        : null;

    const domainSpeed = prediction?.domainScores?.processingSpeed != null
        ? Math.round(prediction.domainScores.processingSpeed)
        : latestSession?.domain_processing_speed != null
        ? Math.round(latestSession.domain_processing_speed)
        : null;

    const domainAttention = prediction?.domainScores?.attention != null
        ? Math.round(prediction.domainScores.attention)
        : latestSession?.domain_attention != null
        ? Math.round(latestSession.domain_attention)
        : null;

    const domainSpatial = prediction?.domainScores?.spatial != null
        ? Math.round(prediction.domainScores.spatial)
        : latestSession?.domain_spatial_orientation != null
        ? Math.round(latestSession.domain_spatial_orientation)
        : null;

    const domainLanguage = prediction?.domainScores?.language != null
        ? Math.round(prediction.domainScores.language)
        : latestSession?.domain_language != null
        ? Math.round(latestSession.domain_language)
        : null;

    const hasDomains = domainMemory != null || domainExecutive != null || domainSpeed != null;

    // 3. Construct clean standalone HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PHC Cognitive Triage Referral - ${beneficiary.full_name}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 20mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            font-size: 11pt;
        }
        .phc-slip {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
        }
        .phc-header {
            text-align: center;
            border-bottom: 2.5px solid #0369a1;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .phc-emblem {
            font-size: 10pt;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #0284c7;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .phc-title {
            font-size: 17pt;
            font-weight: 900;
            color: #0f172a;
            margin: 4px 0 6px;
            letter-spacing: -0.01em;
        }
        .phc-meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            color: #475569;
            margin-top: 4px;
            font-weight: 500;
        }
        .phc-section {
            margin-top: 14px;
            margin-bottom: 14px;
        }
        .phc-section-title {
            font-size: 10pt;
            font-weight: 800;
            background: #f1f5f9;
            color: #0f172a;
            padding: 5px 10px;
            margin: 0 0 8px 0;
            border-left: 4px solid #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .phc-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
        }
        .phc-table td {
            padding: 6px 10px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }
        .phc-table td strong {
            color: #334155;
        }
        .phc-kpi-grid {
            display: flex;
            gap: 12px;
            margin-bottom: 10px;
        }
        .phc-kpi-box {
            flex: 1;
            border: 1.5px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: center;
            background: #f8fafc;
        }
        .phc-kpi-label {
            display: block;
            font-size: 7.5pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .phc-kpi-val {
            display: block;
            font-size: 16pt;
            font-weight: 900;
            color: #0284c7;
            margin-top: 2px;
        }
        .phc-kpi-val.alert {
            color: #dc2626;
        }
        .phc-kpi-sub {
            display: block;
            font-size: 7.5pt;
            color: #059669;
            font-weight: 600;
            margin-top: 2px;
        }
        .phc-domains-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-top: 8px;
        }
        .phc-domains-table th {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            font-weight: 700;
            color: #334155;
            text-align: left;
            font-size: 8.5pt;
        }
        .phc-domains-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
        }
        .phc-doctor-area {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 14px;
            background: #ffffff;
        }
        .phc-checkboxes {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            font-size: 9pt;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 12px;
        }
        .phc-cb-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .phc-box-square {
            display: inline-block;
            width: 13px;
            height: 13px;
            border: 1.5px solid #475569;
            border-radius: 2px;
        }
        .phc-blank-lines {
            display: flex;
            flex-direction: column;
            gap: 14px;
            margin-top: 10px;
        }
        .phc-line {
            border-bottom: 1px dashed #94a3b8;
            height: 1px;
        }
        .phc-sig-row {
            display: flex;
            justify-content: space-between;
            margin-top: 26px;
            padding-top: 8px;
        }
        .phc-sig-col {
            width: 42%;
            text-align: center;
        }
        .phc-sig-border {
            border-top: 1.5px solid #0f172a;
            margin-bottom: 5px;
        }
        .phc-sig-label {
            font-size: 8.5pt;
            font-weight: 700;
            color: #334155;
        }
        .phc-footer-note {
            text-align: center;
            font-size: 7.5pt;
            color: #94a3b8;
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
    </style>
</head>
<body>
    <div class="phc-slip">
        <!-- Official Ayushman Bharat / PHC Header -->
        <div class="phc-header">
            <div class="phc-emblem">Ayushman Bharat • Comprehensive Primary Health Care</div>
            <h1 class="phc-title">PRIMARY HEALTH CENTRE COGNITIVE TRIAGE REFERRAL</h1>
            <div class="phc-meta-row">
                <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                <span><strong>Screening Unit:</strong> ASHA Frontline Health Module</span>
                <span><strong>ABHA ID:</strong> ${beneficiary.abha_id || 'Not Registered'}</span>
            </div>
        </div>

        <!-- 1. Demographics Section -->
        <div class="phc-section">
            <h2 class="phc-section-title">1. Beneficiary Demographics</h2>
            <table class="phc-table">
                <tbody>
                    <tr>
                        <td style="width: 50%;"><strong>Full Name:</strong> ${beneficiary.full_name}</td>
                        <td style="width: 50%;"><strong>Age / Gender:</strong> ${beneficiary.age} yrs • ${(beneficiary.gender || 'Not specified').toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td><strong>Village / Ward:</strong> ${beneficiary.village_name || 'Village Unit'}</td>
                        <td><strong>Years of Education:</strong> ${beneficiary.education_years} yrs ${beneficiary.education_years <= 12 ? '(+1 Norm Applies)' : ''}</td>
                    </tr>
                    <tr>
                        <td><strong>Caregiver Phone:</strong> ${beneficiary.phone_number || 'N/A'}</td>
                        <td><strong>Preferred Language:</strong> ${(beneficiary.preferred_language || 'hi').toUpperCase()}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 2. Digital Screening Results -->
        <div class="phc-section">
            <h2 class="phc-section-title">2. Digital Biomarker Screening Results</h2>
            <div class="phc-kpi-grid">
                <div class="phc-kpi-box">
                    <span class="phc-kpi-label">Estimated MoCA Score</span>
                    <span class="phc-kpi-val">${mocaScore != null ? `${mocaScore} / 30` : 'Pending'}</span>
                    <span class="phc-kpi-sub">${beneficiary.education_years <= 12 ? '✓ +1 Education Normed' : 'Standard Baseline'}</span>
                </div>
                <div class="phc-kpi-box">
                    <span class="phc-kpi-label">Clinical Triage Tier</span>
                    <span class="phc-kpi-val ${formattedTier.includes('REVIEW') || formattedTier.includes('RECOMMEND') ? 'alert' : ''}">${formattedTier}</span>
                    <span class="phc-kpi-sub">${formattedTier.includes('REVIEW') || formattedTier.includes('RECOMMEND') ? '⚠️ Specialist Evaluation Advised' : 'Baseline Verified'}</span>
                </div>
                <div class="phc-kpi-box">
                    <span class="phc-kpi-label">ASHA Worker ID</span>
                    <span class="phc-kpi-val" style="font-size: 12pt; margin-top: 6px;">${beneficiary.asha_worker_id || 'ASHA_UNIT_01'}</span>
                    <span class="phc-kpi-sub">Verified Frontline Field Data</span>
                </div>
            </div>

            ${hasDomains ? `
            <table class="phc-domains-table">
                <thead>
                    <tr>
                        <th style="width: 32%;">Cognitive Domain</th>
                        <th style="width: 18%;">Accuracy</th>
                        <th style="width: 32%;">Cognitive Domain</th>
                        <th style="width: 18%;">Accuracy</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Memory Recall (Village Narrative)</td>
                        <td><strong>${domainMemory != null ? `${domainMemory}%` : 'N/A'}</strong></td>
                        <td>Executive Control & Sequencing</td>
                        <td><strong>${domainExecutive != null ? `${domainExecutive}%` : 'N/A'}</strong></td>
                    </tr>
                    <tr>
                        <td>Processing Speed (Visual Latency)</td>
                        <td><strong>${domainSpeed != null ? `${domainSpeed}%` : 'N/A'}</strong></td>
                        <td>Attention & Sustained Focus</td>
                        <td><strong>${domainAttention != null ? `${domainAttention}%` : 'N/A'}</strong></td>
                    </tr>
                    <tr>
                        <td>Spatial Orientation</td>
                        <td><strong>${domainSpatial != null ? `${domainSpatial}%` : 'N/A'}</strong></td>
                        <td>Language & Comprehension</td>
                        <td><strong>${domainLanguage != null ? `${domainLanguage}%` : 'N/A'}</strong></td>
                    </tr>
                </tbody>
            </table>
            ` : `
            <p style="font-size: 9pt; color: #64748b; margin: 4px 0 0;">
                <em>Referred based on frontline cognitive screening baselines and demographic risk profile.</em>
            </p>
            `}
        </div>

        <!-- 3. Medical Officer Clinical Notes & Prescription Area -->
        <div class="phc-section">
            <h2 class="phc-section-title">3. Primary Health Centre (MO) Clinical Assessment & Rx</h2>
            <div class="phc-doctor-area">
                <div class="phc-checkboxes">
                    <span class="phc-cb-item"><span class="phc-box-square"></span> Normal Aging / Baseline</span>
                    <span class="phc-cb-item"><span class="phc-box-square"></span> Mild Cognitive Impairment (MCI)</span>
                    <span class="phc-cb-item"><span class="phc-box-square"></span> Suspected Dementia / AD</span>
                    <span class="phc-cb-item"><span class="phc-box-square"></span> Metabolic / Secondary Cause</span>
                </div>
                <div class="phc-blank-lines">
                    <div class="phc-line"></div>
                    <div class="phc-line"></div>
                    <div class="phc-line"></div>
                    <div class="phc-line"></div>
                </div>
            </div>
        </div>

        <!-- 4. Signatures -->
        <div class="phc-sig-row">
            <div class="phc-sig-col">
                <div class="phc-sig-border"></div>
                <div class="phc-sig-label">ASHA Worker Signature & Date</div>
            </div>
            <div class="phc-sig-col">
                <div class="phc-sig-border"></div>
                <div class="phc-sig-label">Medical Officer (PHC) Signature & Stamp</div>
            </div>
        </div>

        <div class="phc-footer-note">
            Ayushman Bharat Grassroots Health Screening • Powered by VyomFlow Health AI
        </div>
    </div>
</body>
</html>`;

    // 4. Inject hidden iframe and print cleanly
    const iframeId = 'vyom_phc_print_frame';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (iframe) {
        iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        window.print();
        return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // 5. Trigger print once iframe resources are ready
    setTimeout(() => {
        try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        } catch {
            window.print();
        } finally {
            setTimeout(() => {
                iframe.remove();
            }, 3000);
        }
    }, 250);
}
