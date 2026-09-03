/**
 * Sarvam AI Locale Translation CLI
 * Translates en.json into the 10 Core Indian Languages using Sarvam AI's official translate API (sarvam-translate:v1).
 *
 * Supported Target Languages:
 *   hi: Hindi (hi-IN)
 *   bn: Bengali (bn-IN)
 *   te: Telugu (te-IN)
 *   mr: Marathi (mr-IN)
 *   ta: Tamil (ta-IN)
 *   gu: Gujarati (gu-IN)
 *   kn: Kannada (kn-IN)
 *   od: Odia (od-IN)
 *   pa: Punjabi (pa-IN)
 *   ml: Malayalam (ml-IN)
 *
 * Usage:
 *   node scripts/sarvam-translate-locales.mjs --force          # Translate all 10 languages
 *   node scripts/sarvam-translate-locales.mjs --lang=hi        # Translate only Hindi
 *   node scripts/sarvam-translate-locales.mjs --lang=ta,te     # Translate specific languages
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'src', 'i18n', 'locales');

// Load API Key from environment or fallback
const API_KEY = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

const TARGET_LANGUAGES = {
    hi: { code: 'hi-IN', name: 'Hindi' },
    bn: { code: 'bn-IN', name: 'Bengali' },
    te: { code: 'te-IN', name: 'Telugu' },
    mr: { code: 'mr-IN', name: 'Marathi' },
    ta: { code: 'ta-IN', name: 'Tamil' },
    gu: { code: 'gu-IN', name: 'Gujarati' },
    kn: { code: 'kn-IN', name: 'Kannada' },
    od: { code: 'od-IN', name: 'Odia' },
    pa: { code: 'pa-IN', name: 'Punjabi' },
    ml: { code: 'ml-IN', name: 'Malayalam' },
};

// Keys that MUST remain in pristine English (Not translated)
const UNTRANSLATED_EXACT_KEYS = new Set([
    'landing.brandName',
    'onboarding.brandName',
    'common.vyomflow',
    'mixed.estimatedMoCA',
    'mixed.riskScore',
    'mixed.executiveFunctionClinician',
    'mixed.spatialNavigationClinician',
    'dashboardV3.estimatedMoCA',
    'dashboardV3.riskScore',
    'dashboard.downloadReport',
    'dashboardV3.downloadReport',
    'dashboard.exportReport',
    'common.dashboard',
]);

// Terms that should never be translated when found inside sentences (Preserved in English)
const PROTECTED_TERMS = [
    'Reliable Change Index (RCI)',
    'Standard Error of Measurement (SEM)',
    'Coefficient of Variation (CV)',
    'Confidence Interval (CI)',
    'Machine Learning (ML)',
    'Type-Token Ratio (TTR)',
    'Digital Biomarkers',
    'Theil-Sen Slope',
    'Reliable Change Index',
    'Root-TTR',
    'Root TTR',
    'FDA SaMD',
    'XGBoost',
    'AUROC',
    'MMSE',
    'MoCA',
    'NACC',
    'SHAP',
    'ROC',
    'Z-Score',
    'Z-Drift',
    'F1 Score',
    'Firebase',
    'VyomFlow',
    'Dashboard',
    'Export PDF',
    'Download Report',
    'Session ID',
    'PDF',
    'CSV',
    'API',
    'ML',
    'AI',
];

function flatten(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
            Object.assign(result, flatten(value, fullKey));
        } else {
            result[fullKey] = value;
        }
    }
    return result;
}

function unflatten(obj) {
    const result = {};
    for (const [flatKey, value] of Object.entries(obj)) {
        const parts = flatKey.split('.');
        let cur = result;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {};
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
    }
    return result;
}

const DELIM = '\n---DELIM---\n';

async function callSarvamTranslate(inputText, targetCode, retries = 4) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch('https://api.sarvam.ai/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': API_KEY,
                },
                body: JSON.stringify({
                    input: inputText,
                    source_language_code: 'en-IN',
                    target_language_code: targetCode,
                    model: 'sarvam-translate:v1',
                }),
            });

            if (res.status === 429) {
                console.warn(`    [Rate Limit 429] Backing off for attempt ${attempt}...`);
                await new Promise(r => setTimeout(r, 2000 * attempt));
                continue;
            }

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HTTP ${res.status}: ${errText}`);
            }

            const data = await res.json();
            return data.translated_text || '';
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
    return '';
}

async function translateLanguage(langKey, langInfo, enFlat, isForce = false) {
    console.log(`\n============================================================`);
    console.log(`🌐 Syncing ${langInfo.name} (${langInfo.code}) [${langKey}]`);
    console.log(`============================================================`);

    const outPath = join(localesDir, `${langKey}.json`);
    let existingFlat = {};
    if (!isForce && existsSync(outPath)) {
        try {
            existingFlat = flatten(JSON.parse(readFileSync(outPath, 'utf-8')));
        } catch {
            existingFlat = {};
        }
    }

    // Determine which keys need translation
    const keysToTranslate = [];
    for (const key of Object.keys(enFlat)) {
        if (UNTRANSLATED_EXACT_KEYS.has(key)) continue;
        if (isForce || !existingFlat[key] || String(existingFlat[key]).trim() === '') {
            keysToTranslate.push(key);
        }
    }

    const translatedMap = { ...existingFlat };
    for (const k of UNTRANSLATED_EXACT_KEYS) {
        translatedMap[k] = enFlat[k];
    }

    console.log(`  📊 Status: ${Object.keys(enFlat).length} total keys | ${keysToTranslate.length} to translate | ${Object.keys(enFlat).length - keysToTranslate.length} preserved`);

    if (keysToTranslate.length === 0) {
        console.log(`  ✨ All keys are already translated and up to date!`);
        const nested = unflatten(translatedMap);
        writeFileSync(outPath, JSON.stringify(nested, null, 2) + '\n', 'utf-8');
        if (langKey === 'od') {
            copyFileSync(outPath, join(localesDir, 'or.json'));
        }
        return;
    }

    const rawValues = keysToTranslate.map(k => String(enFlat[k]));

    // Protect {{var}} using __VAR_x__ tokens and protected technical terms using __TERM_x__
    const varList = [];
    const termList = [];
    const sortedTerms = [...PROTECTED_TERMS].sort((a, b) => b.length - a.length);

    const protectedValues = rawValues.map(v => {
        let text = v.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, varName) => {
            const idx = varList.length;
            varList.push(varName);
            return `__VAR_${idx}__`;
        });

        for (const term of sortedTerms) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'g');
            text = text.replace(regex, (matched) => {
                const idx = termList.length;
                termList.push(matched);
                return `__TERM_${idx}__`;
            });
        }
        return text;
    });

    // Group keys into batches with max char limit ~1200 characters per batch
    const batches = [];
    let currentBatchKeys = [];
    let currentBatchValues = [];
    let currentBatchLen = 0;

    for (let i = 0; i < keysToTranslate.length; i++) {
        const val = protectedValues[i];
        const valLen = val.length + DELIM.length;

        if (currentBatchKeys.length >= 25 || (currentBatchLen + valLen > 1200 && currentBatchKeys.length > 0)) {
            batches.push({ keys: currentBatchKeys, values: currentBatchValues });
            currentBatchKeys = [];
            currentBatchValues = [];
            currentBatchLen = 0;
        }

        currentBatchKeys.push(keysToTranslate[i]);
        currentBatchValues.push(val);
        currentBatchLen += valLen;
    }

    if (currentBatchKeys.length > 0) {
        batches.push({ keys: currentBatchKeys, values: currentBatchValues });
    }

    console.log(`  📦 Split ${keysToTranslate.length} items into ${batches.length} translation batches`);

    let processedCount = 0;

    const restoreVars = (text) => {
        let restored = text.replace(/__TERM_(\d+)__/g, (_, idxStr) => {
            const idx = parseInt(idxStr, 10);
            return termList[idx] !== undefined ? termList[idx] : _;
        });
        restored = restored.replace(/__VAR_(\d+)__/g, (_, idxStr) => {
            const idx = parseInt(idxStr, 10);
            return `{{${varList[idx] || ''}}}`;
        });
        return restored;
    };

    for (let bIndex = 0; bIndex < batches.length; bIndex++) {
        const batch = batches[bIndex];
        const batchText = batch.values.join(DELIM);

        let success = false;
        try {
            const translatedBatchText = await callSarvamTranslate(batchText, langInfo.code);
            const parts = translatedBatchText.split(/---DELIM---/i).map(s => s.trim());

            if (parts.length === batch.values.length) {
                for (let j = 0; j < batch.values.length; j++) {
                    const key = batch.keys[j];
                    translatedMap[key] = restoreVars(parts[j]);
                }
                success = true;
            } else {
                console.warn(`  ⚠️ Batch ${bIndex + 1}/${batches.length}: delimiter count mismatch (got ${parts.length}, expected ${batch.values.length}). Translating line-by-line...`);
            }
        } catch (err) {
            console.warn(`  ⚠️ Batch ${bIndex + 1}/${batches.length} error: ${err.message}. Falling back to individual translations.`);
        }

        // Fallback for this batch if delimiter mismatch or network error
        if (!success) {
            for (let j = 0; j < batch.values.length; j++) {
                const key = batch.keys[j];
                const originalVal = enFlat[key];
                const protVal = batch.values[j];

                try {
                    const single = await callSarvamTranslate(protVal, langInfo.code);
                    translatedMap[key] = restoreVars(single).trim() || originalVal;
                } catch {
                    translatedMap[key] = originalVal;
                }
                await new Promise(r => setTimeout(r, 150));
            }
        }

        processedCount += batch.values.length;
        process.stdout.write(`  ✅ Translated ${processedCount}/${keysToTranslate.length} strings...\r`);
        await new Promise(r => setTimeout(r, 450));
    }

    const nested = unflatten(translatedMap);
    writeFileSync(outPath, JSON.stringify(nested, null, 2) + '\n', 'utf-8');
    console.log(`\n  🎉 Wrote ${langKey}.json (${Object.keys(translatedMap).length} strings in locale)`);

    // If Odia (od), also sync to or.json for backwards compatibility
    if (langKey === 'od') {
        const orPath = join(localesDir, 'or.json');
        copyFileSync(outPath, orPath);
        console.log(`  🔗 Copied od.json -> or.json (backwards-compatibility alias)`);
    }
}

async function main() {
    const enSourcePath = join(localesDir, 'en.json');
    const enJson = JSON.parse(readFileSync(enSourcePath, 'utf-8'));
    const enFlat = flatten(enJson);

    console.log(`🚀 Sarvam AI Translation Pipeline initialized.`);
    console.log(`📖 Source: en.json (${Object.keys(enFlat).length} keys)`);
    console.log(`🔑 Sarvam API Key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);

    const args = process.argv.slice(2);
    const isForce = args.includes('--force');
    const langArg = args.find(a => a.startsWith('--lang='));
    let selectedKeys = Object.keys(TARGET_LANGUAGES);

    if (langArg) {
        const list = langArg.split('=')[1].split(',').map(s => s.trim().toLowerCase());
        selectedKeys = list.filter(k => TARGET_LANGUAGES[k]);
    }

    console.log(`🎯 Target Languages (${selectedKeys.length}): ${selectedKeys.map(k => `${TARGET_LANGUAGES[k].name} [${k}]`).join(', ')}`);
    if (isForce) console.log(`⚡ Force mode enabled: Re-translating all strings.`);

    for (const key of selectedKeys) {
        await translateLanguage(key, TARGET_LANGUAGES[key], enFlat, isForce);
    }

    console.log(`\n============================================================`);
    console.log(`🌟 All Sarvam AI translations completed successfully!`);
    console.log(`============================================================\n`);
}

main().catch(err => {
    console.error('\n❌ Translation pipeline failed:', err);
    process.exit(1);
});
