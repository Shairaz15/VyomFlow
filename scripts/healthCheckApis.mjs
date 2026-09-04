import fs from 'fs';
import path from 'path';

// Parse .env file
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...vals] = trimmed.split('=');
        if (key) env[key.trim()] = vals.join('=').trim();
    }
    return env;
}

const env = loadEnv();
const GEMINI_KEY = env.VITE_GEMINI_API_KEY || '';
const SARVAM_KEY = env.SARVAM_API_KEY || env.VITE_SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

console.log('====================================================');
console.log('     COGNITRACK API LIVE HEALTH CHECK & LATENCY     ');
console.log('====================================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Gemini Key configured: ${GEMINI_KEY ? 'Yes (' + GEMINI_KEY.slice(0, 8) + '...)' : 'No'}`);
console.log(`Sarvam Key configured: ${SARVAM_KEY ? 'Yes (' + SARVAM_KEY.slice(0, 8) + '...)' : 'No'}`);
console.log('----------------------------------------------------\n');

const results = {
    gemini: [],
    sarvam: []
};

// 1. GEMINI TESTS
async function testGemini() {
    console.log('--- [1/2] Testing Google Gemini API ---');
    if (!GEMINI_KEY) {
        console.log('❌ Gemini API key missing in .env');
        return;
    }

    // A. Query models endpoint to discover supported models for this key
    try {
        const t0 = performance.now();
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
        const t1 = performance.now();
        const duration = Math.round(t1 - t0);
        const data = await res.json();
        
        if (res.ok && data.models) {
            console.log(`✅ [GET /models]: HTTP ${res.status} | Latency: ${duration}ms | Models available: ${data.models.length}`);
            results.gemini.push({ test: 'GET /v1beta/models', status: 'HEALTHY', httpStatus: res.status, latencyMs: duration });
        } else {
            console.log(`❌ [GET /models]: HTTP ${res.status} | Latency: ${duration}ms | Error: ${data.error?.message || JSON.stringify(data)}`);
            results.gemini.push({ test: 'GET /v1beta/models', status: 'FAILED', httpStatus: res.status, latencyMs: duration, error: data.error?.message });
        }
    } catch (err) {
        console.log(`❌ Gemini Models List error:`, err.message);
        results.gemini.push({ test: 'GET /v1beta/models', status: 'ERROR', error: err.message });
    }

    // Models used in CogniTrack services (languageGeminiService, aiAssistantService, StoryMatchingService)
    const modelsToBenchmark = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.5-flash',
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-flash-latest'
    ];

    for (const model of modelsToBenchmark) {
        const runs = [];
        let lastStatus = 0;
        let lastSample = '';
        let lastError = null;

        for (let i = 0; i < 2; i++) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
                const t0 = performance.now();
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: 'Assess sentence: "The elderly patient walked slowly in the garden." Reply with JSON {"fluencyScore": 88, "status": "normal"}' }] }],
                        generationConfig: { maxOutputTokens: 50, temperature: 0.2 }
                    })
                });
                const t1 = performance.now();
                const duration = Math.round(t1 - t0);
                lastStatus = res.status;
                const data = await res.json();

                if (res.ok) {
                    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                    runs.push(duration);
                    lastSample = answer.replace(/[\r\n]+/g, ' ').slice(0, 70);
                } else {
                    lastError = data.error?.message || `HTTP ${res.status}`;
                }
            } catch (err) {
                lastError = err.message;
            }
        }

        if (runs.length > 0) {
            const avg = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length);
            console.log(`✅ [${model}]: HTTP ${lastStatus} | Avg Latency: ${avg}ms (runs: ${runs.join(', ')}ms) | Sample: "${lastSample}"`);
            results.gemini.push({ model, status: 'HEALTHY', httpStatus: lastStatus, latencyMs: avg, runs, sample: lastSample });
        } else {
            console.log(`⚠️ [${model}]: HTTP ${lastStatus} | Not responding: ${lastError?.slice(0, 80)}`);
            results.gemini.push({ model, status: 'FAILED', httpStatus: lastStatus, error: lastError });
        }
    }
}

// 2. SARVAM AI TESTS
async function testSarvam() {
    console.log('\n--- [2/2] Testing Sarvam AI API ---');
    if (!SARVAM_KEY) {
        console.log('❌ Sarvam API key missing in .env');
        return;
    }

    // A. Sarvam Translate (sarvam-translate:v1)
    const translateRuns = [];
    let transSample = '';
    let transStatus = 0;
    let transError = null;

    for (let i = 1; i <= 3; i++) {
        try {
            const t0 = performance.now();
            const res = await fetch('https://api.sarvam.ai/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': SARVAM_KEY
                },
                body: JSON.stringify({
                    input: 'Your cognitive assessment session is now ready.',
                    source_language_code: 'en-IN',
                    target_language_code: 'hi-IN',
                    speaker_gender: 'Female',
                    mode: 'formal',
                    model: 'sarvam-translate:v1'
                })
            });
            const t1 = performance.now();
            const duration = Math.round(t1 - t0);
            transStatus = res.status;
            const data = await res.json();

            if (res.ok) {
                translateRuns.push(duration);
                transSample = data.translated_text;
            } else {
                transError = data.error?.message || JSON.stringify(data);
            }
        } catch (err) {
            transError = err.message;
        }
    }

    if (translateRuns.length > 0) {
        const avg = Math.round(translateRuns.reduce((a, b) => a + b, 0) / translateRuns.length);
        console.log(`✅ [Sarvam Translate]: HTTP ${transStatus} | Avg Latency: ${avg}ms (runs: ${translateRuns.join(', ')}ms) | Translated: "${transSample}"`);
        results.sarvam.push({ service: 'Translate (sarvam-translate:v1)', status: 'HEALTHY', httpStatus: transStatus, latencyMs: avg, runs: translateRuns, output: transSample });
    } else {
        console.log(`❌ [Sarvam Translate]: HTTP ${transStatus} | Error: ${transError}`);
        results.sarvam.push({ service: 'Translate (sarvam-translate:v1)', status: 'FAILED', httpStatus: transStatus, error: transError });
    }

    // B. Sarvam Text-to-Speech (TTS) using CogniTrack's exact production config
    // model: 'bulbul:v3', speaker: 'priya'
    const ttsRuns = [];
    let ttsAudioLen = 0;
    let ttsStatus = 0;
    let ttsError = null;

    for (let i = 1; i <= 3; i++) {
        try {
            const t0 = performance.now();
            const res = await fetch('https://api.sarvam.ai/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': SARVAM_KEY
                },
                body: JSON.stringify({
                    inputs: ['नमस्ते, कॉग्नीट्रैक में आपका स्वागत है।'],
                    target_language_code: 'hi-IN',
                    speaker: 'priya',
                    model: 'bulbul:v3',
                    pace: 0.95,
                    speech_sample_rate: 22050,
                    enable_preprocessing: true
                })
            });
            const t1 = performance.now();
            const duration = Math.round(t1 - t0);
            ttsStatus = res.status;
            const data = await res.json();

            if (res.ok) {
                ttsRuns.push(duration);
                ttsAudioLen = data.audios?.[0]?.length || 0;
            } else {
                ttsError = data.error?.message || JSON.stringify(data);
            }
        } catch (err) {
            ttsError = err.message;
        }
    }

    if (ttsRuns.length > 0) {
        const avg = Math.round(ttsRuns.reduce((a, b) => a + b, 0) / ttsRuns.length);
        console.log(`✅ [Sarvam TTS (Bulbul v3 - Priya)]: HTTP ${ttsStatus} | Avg Latency: ${avg}ms (runs: ${ttsRuns.join(', ')}ms) | Audio: ${ttsAudioLen} base64 chars`);
        results.sarvam.push({ service: 'TTS (Bulbul v3 - Priya)', status: 'HEALTHY', httpStatus: ttsStatus, latencyMs: avg, runs: ttsRuns, audioBytesApprox: Math.round(ttsAudioLen * 0.75) });
    } else {
        console.log(`❌ [Sarvam TTS (Bulbul v3)]: HTTP ${ttsStatus} | Error: ${ttsError}`);
        results.sarvam.push({ service: 'TTS (Bulbul v3)', status: 'FAILED', httpStatus: ttsStatus, error: ttsError });
    }
}

async function run() {
    await testGemini();
    await testSarvam();

    console.log('\n====================================================');
    console.log('              FINAL BENCHMARK REPORT                ');
    console.log('====================================================');
    console.table([...results.gemini.map(g => ({ Provider: 'Google Gemini', Service: g.model || g.test, Status: g.status, 'HTTP': g.httpStatus, 'Latency (ms)': g.latencyMs })),
                 ...results.sarvam.map(s => ({ Provider: 'Sarvam AI', Service: s.service, Status: s.status, 'HTTP': s.httpStatus, 'Latency (ms)': s.latencyMs }))]);
}

run();
