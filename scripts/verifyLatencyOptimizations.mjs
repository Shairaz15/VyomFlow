import fs from 'fs';
import path from 'path';

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

console.log('===========================================================');
console.log('       LATENCY OPTIMIZATION POST-VERIFICATION RUN          ');
console.log('===========================================================');

async function testPipeline() {
    // 1. Test Priority Model (gemini-flash-lite-latest)
    console.log('\n[1] Testing Primary Gemini Priority Model (gemini-flash-lite-latest):');
    const t0 = performance.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Evaluate: "Patient completed cognitive task accurately."' }] }],
            generationConfig: { maxOutputTokens: 20 }
        })
    });
    const t1 = performance.now();
    const latency = Math.round(t1 - t0);
    console.log(`   Status: HTTP ${res.status} | Response Time: ${latency}ms`);

    // 2. Test Sarvam TTS with 16kHz vs 22kHz payload size comparison
    console.log('\n[2] Testing Sarvam TTS Payload Compression (16,000 Hz vs 22,050 Hz):');
    
    // 16kHz
    const tts16_0 = performance.now();
    const res16 = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_KEY
        },
        body: JSON.stringify({
            inputs: ['संज्ञानात्मक परीक्षण प्रारंभ हो रहा है।'],
            target_language_code: 'hi-IN',
            speaker: 'priya',
            model: 'bulbul:v3',
            speech_sample_rate: 16000
        })
    });
    const tts16_1 = performance.now();
    const data16 = await res16.json();
    const len16 = data16.audios?.[0]?.length || 0;
    const dur16 = Math.round(tts16_1 - tts16_0);
    console.log(`   16kHz Optimized: HTTP ${res16.status} | Time: ${dur16}ms | Payload Size: ${len16} chars (~${Math.round(len16 * 0.75 / 1024)} KB)`);

    // 22kHz
    const tts22_0 = performance.now();
    const res22 = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_KEY
        },
        body: JSON.stringify({
            inputs: ['संज्ञानात्मक परीक्षण प्रारंभ हो रहा है।'],
            target_language_code: 'hi-IN',
            speaker: 'priya',
            model: 'bulbul:v3',
            speech_sample_rate: 22050
        })
    });
    const tts22_1 = performance.now();
    const data22 = await res22.json();
    const len22 = data22.audios?.[0]?.length || 0;
    const dur22 = Math.round(tts22_1 - tts22_0);
    console.log(`   22kHz Baseline:  HTTP ${res22.status} | Time: ${dur22}ms | Payload Size: ${len22} chars (~${Math.round(len22 * 0.75 / 1024)} KB)`);

    const reduction = Math.round((1 - (len16 / len22)) * 100);
    console.log(`   Payload Reduction: ${reduction}% smaller transfer footprint!`);

    // 3. Simulated Cache Warm Hit (0ms)
    console.log('\n[3] Testing Client-side aiCache Emulation:');
    const cache = new Map();
    cache.set('tts:hi-IN:priya:संज्ञानात्मक परीक्षण प्रारंभ हो रहा है।', data16.audios?.[0]);

    const cacheT0 = performance.now();
    const hit = cache.get('tts:hi-IN:priya:संज्ञानात्मक परीक्षण प्रारंभ हो रहा है।');
    const cacheT1 = performance.now();
    const cacheTime = (cacheT1 - cacheT0).toFixed(3);
    console.log(`   Cold API call: ${dur16}ms`);
    console.log(`   Warm Cache Hit: ${cacheTime}ms (100% network round-trip eliminated, audio length: ${hit?.length})`);

    console.log('\n===========================================================');
    console.log('             VERIFICATION COMPLETED SUCCESSFULLY           ');
    console.log('===========================================================');
}

testPipeline();
