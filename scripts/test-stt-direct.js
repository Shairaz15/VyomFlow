import fs from 'fs';

const SARVAM_API_KEY = process.env.VITE_SARVAM_API_KEY || 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

async function testSTTDirect() {
    console.log('Testing Sarvam AI direct Speech-to-Text...');

    // First generate a small audio sample using TTS
    const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY
        },
        body: JSON.stringify({
            inputs: ["This is a test of Sarvam AI speech to text transcription for VyomFlow."],
            target_language_code: "en-IN",
            speaker: "anushka",
            model: "bulbul:v2"
        })
    });

    const ttsData = await ttsRes.json();
    if (!ttsData.audios || !ttsData.audios[0]) {
        console.error('TTS failed:', ttsData);
        return;
    }

    const audioBuffer = Buffer.from(ttsData.audios[0], 'base64');
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });

    const formData = new FormData();
    formData.append('file', blob, 'sample.wav');
    formData.append('model', 'saaras:v4');
    formData.append('mode', 'transcribe');

    console.log('Sending audio blob to https://api.sarvam.ai/speech-to-text ...');
    const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
            'api-subscription-key': SARVAM_API_KEY
        },
        body: formData
    });

    console.log('STT Status:', sttRes.status);
    const sttData = await sttRes.json();
    console.log('STT Result:', JSON.stringify(sttData, null, 2));
}

testSTTDirect();
