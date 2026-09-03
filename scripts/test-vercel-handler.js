import fs from 'fs';

const SARVAM_API_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

async function testVercelHandlerLogic() {
  console.log('Testing Vercel Serverless Function forwarding logic...');

  // Create FormData like the browser does
  const formData = new FormData();
  const sampleWavHeader = Buffer.alloc(44);
  sampleWavHeader.write('RIFF', 0);
  sampleWavHeader.writeUInt32LE(36, 4);
  sampleWavHeader.write('WAVE', 8);
  
  const blob = new Blob([sampleWavHeader], { type: 'audio/wav' });
  formData.append('file', blob, 'spoken_speech.wav');
  formData.append('model', 'saaras:v4');
  formData.append('mode', 'transcribe');

  // Convert FormData to a Request object to get headers & arrayBuffer like Vercel receives
  const reqDummy = new Request('http://localhost/api/sarvam-stt', {
    method: 'POST',
    body: formData,
  });

  const contentType = reqDummy.headers.get('content-type');
  const buffer = Buffer.from(await reqDummy.arrayBuffer());

  console.log('ContentType generated:', contentType);
  console.log('Buffer length:', buffer.length);

  try {
    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'content-type': contentType,
      },
      body: buffer,
    });

    console.log('Sarvam STT Status:', res.status);
    const text = await res.text();
    console.log('Sarvam STT Body:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testVercelHandlerLogic();
