/**
 * Batch auto-translate en.json into all supported languages.
 * Uses google-translate-api-x with batch mode for speed.
 *
 * Usage:
 *   node scripts/translate-locales.mjs --force         # Translate all languages
 *   node scripts/translate-locales.mjs --lang=hi       # Translate only Hindi
 */

import translate from 'google-translate-api-x';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'src', 'i18n', 'locales');
const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));

// Google Translate language codes
const LANG_MAP = {
    hi: 'hi', bn: 'bn', te: 'te', mr: 'mr', ta: 'ta',
    gu: 'gu', kn: 'kn', or: 'or', pa: 'pa', ml: 'ml',
    as: 'as', mai: 'mai', sd: 'sd', sa: 'sa', ne: 'ne',
    kok: 'gom', mni: 'mni-Mtei', brx: 'hi', doi: 'doi',
    ks: 'ks', sat: 'hi', ur: 'ur',
};

// Flatten nested JSON to flat key-value pairs
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

// Unflatten back to nested object
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

const SEPARATOR = '\n|||DELIM|||\n';

async function translateLanguage(langCode) {
    const googleLang = LANG_MAP[langCode];
    console.log(`\n🌐 Translating → ${langCode} (Google: ${googleLang})`);

    const flat = flatten(en);
    const keys = Object.keys(flat);
    const values = Object.values(flat).map(v => String(v));

    // Protect brand names and placeholders
    const BRAND_KEYS = new Set(['landing.brandName', 'onboarding.brandName', 'common.vyomflow']);

    // Replace {{var}} placeholders with safe tokens before translation
    const safed = values.map(v => v.replace(/\{\{(\w+)\}\}/g, '⟨⟨$1⟩⟩'));

    // Split into chunks of ~40 strings to avoid hitting length limits
    const CHUNK_SIZE = 40;
    const translatedValues = [];

    for (let i = 0; i < safed.length; i += CHUNK_SIZE) {
        const chunk = safed.slice(i, i + CHUNK_SIZE);
        const chunkKeys = keys.slice(i, i + CHUNK_SIZE);

        // Join with delimiter
        const batchText = chunk.join(SEPARATOR);

        try {
            const res = await translate(batchText, { to: googleLang, autoCorrect: true });
            const parts = res.text.split(/\|\|\|DELIM\|\|\|/i).map(s => s.trim());

            // If split count matches, great. Otherwise, fallback to individual.
            if (parts.length === chunk.length) {
                for (let j = 0; j < parts.length; j++) {
                    if (BRAND_KEYS.has(chunkKeys[j])) {
                        translatedValues.push(values[i + j]); // keep original
                    } else {
                        // Restore placeholders
                        translatedValues.push(parts[j].replace(/⟨⟨(\w+)⟩⟩/g, '{{$1}}'));
                    }
                }
            } else {
                console.warn(`  ⚠ Chunk ${i}-${i + CHUNK_SIZE}: delimiter mismatch (got ${parts.length}, expected ${chunk.length}). Using individual translate.`);
                // Fallback: translate individually
                for (let j = 0; j < chunk.length; j++) {
                    if (BRAND_KEYS.has(chunkKeys[j])) {
                        translatedValues.push(values[i + j]);
                    } else {
                        try {
                            const individual = await translate(chunk[j], { to: googleLang });
                            translatedValues.push(individual.text.replace(/⟨⟨(\w+)⟩⟩/g, '{{$1}}'));
                        } catch {
                            translatedValues.push(values[i + j]); // English fallback
                        }
                    }
                }
            }
        } catch (err) {
            console.warn(`  ⚠ Batch error for chunk ${i}: ${err.message}. Using English fallback.`);
            for (let j = 0; j < chunk.length; j++) {
                translatedValues.push(values[i + j]);
            }
        }

        process.stdout.write(`  ${Math.min(i + CHUNK_SIZE, safed.length)}/${safed.length} keys...\r`);
        // Small delay between chunks
        await new Promise(r => setTimeout(r, 500));
    }

    // Build result
    const result = {};
    keys.forEach((key, idx) => {
        result[key] = translatedValues[idx];
    });

    const nested = unflatten(result);
    const outPath = join(localesDir, `${langCode}.json`);
    writeFileSync(outPath, JSON.stringify(nested, null, 2), 'utf-8');
    console.log(`\n  ✅ ${langCode}.json written (${translatedValues.length} strings)`);
}

// --- Main ---
async function main() {
    const args = process.argv.slice(2);
    const langArg = args.find(a => a.startsWith('--lang='));
    const singleLang = langArg ? langArg.split('=')[1] : null;
    const langs = singleLang ? [singleLang] : Object.keys(LANG_MAP);

    const flat = flatten(en);
    console.log(`📝 Source: en.json (${Object.keys(flat).length} keys)`);
    console.log(`🎯 Languages: ${langs.join(', ')}\n`);

    for (const lang of langs) {
        await translateLanguage(lang);
    }

    console.log('\n🎉 All translations complete!');
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
