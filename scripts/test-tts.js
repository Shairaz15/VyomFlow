const SARVAM_API_KEY = process.env.VITE_SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

async function testTTS() {
    const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY
        },
        body: JSON.stringify({
            inputs: ["Hello, this is VyomFlow cognitive storytelling narrated by Sarvam AI."],
            target_language_code: "en-IN",
            speaker: "anushka",
            model: "bulbul:v2"
        })
    });

    console.log('Status:', ttsRes.status);
    const data = await ttsRes.json();
    if (data.audios) {
        console.log('🎉 SUCCESS! Generated Sarvam AI audio clips:', data.audios.length, 'Base64 bytes:', data.audios[0].length);
    } else {
        console.error('Error:', data);
    }
}

testTTS();
