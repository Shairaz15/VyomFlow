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
const SARVAM_KEY = env.SARVAM_API_KEY || env.VITE_SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

console.log('====================================================');
console.log('     SARVAM AI SPEECH-TO-TEXT (STT) BENCHMARK      ');
console.log('====================================================\n');

async function testSTT() {
    // Pick an existing audio clip from our pre-rendered story clips
    const sampleAudioPath = path.resolve(process.cwd(), 'public', 'audio', 'stories', 'story_market_easy', 'hi-IN_0.wav');
    if (!fs.existsSync(sampleAudioPath)) {
        console.error('Audio sample not found at:', sampleAudioPath);
        return;
    }

    const audioBuffer = fs.readFileSync(sampleAudioPath);
    console.log(`Testing with Audio File: hi-IN_0.wav (${(audioBuffer.length / 1024).toFixed(1)} KB, 16kHz WAV)\n`);

    // 1. REST Speech-To-Text (Saaras v3 / v4)
    console.log('[1] Testing REST POST /speech-to-text (Saaras:v3):');
    const runs = [];
    let lastTranscript = '';
    let lastLanguage = '';

    for (let i = 1; i <= 3; i++) {
        try {
            const formData = new FormData();
            const blob = new Blob([audioBuffer], { type: 'audio/wav' });
            formData.append('file', blob, 'audio.wav');
            formData.append('model', 'saaras:v3');

            const t0 = performance.now();
            const res = await fetch('https://api.sarvam.ai/speech-to-text', {
                method: 'POST',
                headers: {
                    'api-subscription-key': SARVAM_KEY
                },
                body: formData
            });
            const t1 = performance.now();
            const duration = Math.round(t1 - t0);
            const data = await res.json();

            if (res.ok) {
                runs.push(duration);
                lastTranscript = data.transcript || '';
                lastLanguage = data.language_code || '';
                console.log(`   Sample ${i}: HTTP ${res.status} | Latency: ${duration}ms | Lang: ${data.language_code}`);
            } else {
                console.log(`   Sample ${i}: HTTP ${res.status} | Error: ${JSON.stringify(data)}`);
            }
        } catch (err) {
            console.log(`   Sample ${i}: Error: ${err.message}`);
        }
    }

    if (runs.length > 0) {
        const avg = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length);
        console.log(`\n   ✅ Saaras v3 Avg REST Latency: ${avg}ms`);
        console.log(`   Transcribed Text: "${lastTranscript}"`);
    }

    // 2. REST Speech-To-Text-Translate (Saaras Translate)
    console.log('\n[2] Testing REST POST /speech-to-text-translate (Native Audio -> English):');
    try {
        const formDataTr = new FormData();
        const blobTr = new Blob([audioBuffer], { type: 'audio/wav' });
        formDataTr.append('file', blobTr, 'audio.wav');
        formDataTr.append('model', 'saaras:v3');

        const t0 = performance.now();
        const resTr = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
            method: 'POST',
            headers: {
                'api-subscription-key': SARVAM_KEY
            },
            body: formDataTr
        });
        const t1 = performance.now();
        const durationTr = Math.round(t1 - t0);
        const dataTr = await resTr.json();

        if (resTr.ok) {
            console.log(`   ✅ Saaras Translate Latency: ${durationTr}ms`);
            console.log(`   Direct English Translation: "${dataTr.transcript}"`);
        } else {
            console.log(`   ❌ Saaras Translate HTTP ${resTr.status}:`, dataTr);
        }
    } catch (err) {
        console.log(`   ❌ Saaras Translate error:`, err.message);
    }

    console.log('\n====================================================');
    console.log('              STT BENCHMARK COMPLETED               ');
    console.log('====================================================');
}

testSTT();
