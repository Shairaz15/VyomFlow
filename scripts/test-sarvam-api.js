const SARVAM_API_KEY = process.env.VITE_SARVAM_API_KEY || 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

async function testSarvam() {
    console.log('Testing Sarvam AI API with key:', SARVAM_API_KEY.slice(0, 10) + '...\n');

    // 1. Test Text-to-Speech
    try {
        console.log('1. Testing Sarvam Text-to-Speech (TTS)...');
        const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY
            },
            body: JSON.stringify({
                inputs: ["Hello, welcome to VyomFlow cognitive assessment."],
                target_language_code: "en-IN",
                speaker: "meera",
                model: "bulbul:v1"
            })
        });

        if (ttsRes.ok) {
            const data = await ttsRes.json();
            console.log('✅ Sarvam TTS success! Audio data length:', data.audios ? data.audios[0]?.length : 'N/A');
        } else {
            const err = await ttsRes.text();
            console.error(`❌ Sarvam TTS failed (${ttsRes.status}):`, err);
        }
    } catch (e) {
        console.error('❌ Sarvam TTS Exception:', e.message);
    }

    // 2. Test Text Translation
    try {
        console.log('\n2. Testing Sarvam Text Translation...');
        const transRes = await fetch('https://api.sarvam.ai/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': SARVAM_API_KEY
            },
            body: JSON.stringify({
                input: "Describe your childhood home.",
                source_language_code: "en-IN",
                target_language_code: "hi-IN",
                model: "sarvam-translate:v1"
            })
        });

        if (transRes.ok) {
            const data = await transRes.json();
            console.log('✅ Sarvam Translation success! Translated text:', data.translated_text);
        } else {
            const err = await transRes.text();
            console.error(`❌ Sarvam Translation failed (${transRes.status}):`, err);
        }
    } catch (e) {
        console.error('❌ Sarvam Translation Exception:', e.message);
    }
}

testSarvam();
