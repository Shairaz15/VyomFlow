import fs from 'fs';

const API_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

async function testSarvamDevanagari() {
  console.log('Testing Sarvam AI STT REST API for authentic language output...');
  
  // Test POST to https://api.sarvam.ai/speech-to-text
  const formData = new FormData();
  // Read any test wav or create one
  if (fs.existsSync('test_audio.wav')) {
    const audioBuf = fs.readFileSync('test_audio.wav');
    const blob = new Blob([audioBuf], { type: 'audio/wav' });
    formData.append('file', blob, 'test_audio.wav');
    formData.append('model', 'saaras:v4');
    formData.append('mode', 'transcribe');

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': API_KEY },
      body: formData,
    });

    console.log('Sarvam STT status:', res.status);
    const data = await res.json();
    console.log('Sarvam STT response:', data);
  }
}

testSarvamDevanagari();
