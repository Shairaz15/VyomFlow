const SARVAM_API_KEY = process.env.VITE_SARVAM_API_KEY || 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

async function testTranslateDirect() {
    console.log('Testing Sarvam AI direct Speech Translation (Hindi -> English)...');

    // Generate Hindi speech
    const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY
        },
        body: JSON.stringify({
            inputs: ["मेरा बचपन का घर बहुत सुंदर था और वहां एक बड़ा बगीचा था।"],
            target_language_code: "hi-IN",
            speaker: "anushka",
            model: "bulbul:v2"
        })
    });

    const ttsData = await ttsRes.json();
    const audioBuffer = Buffer.from(ttsData.audios[0], 'base64');
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });

    const formData = new FormData();
    formData.append('file', blob, 'sample.wav');
    formData.append('model', 'saaras:v3');

    console.log('Sending Hindi audio blob to https://api.sarvam.ai/speech-to-text-translate ...');
    const transRes = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
        method: 'POST',
        headers: {
            'api-subscription-key': SARVAM_API_KEY
        },
        body: formData
    });

    console.log('Translation Status:', transRes.status);
    const transData = await transRes.json();
    console.log('Translated to English:', JSON.stringify(transData, null, 2));
}

testTranslateDirect();
