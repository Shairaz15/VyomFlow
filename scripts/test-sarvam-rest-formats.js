import fs from 'fs';

const API_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

async function testFormats() {
  console.log('Testing Sarvam AI STT REST API format compatibility...');

  // Create minimal 16kHz WAV buffer
  const sampleRate = 16000;
  const numSamples = 16000;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const models = ['saaras:v4', 'saaras:v3', 'saaras:v2.5', 'saaras:v2', 'saaras:v1'];
  const filenames = ['audio.wav', 'audio.webm', 'audio.mp4'];

  for (const filename of filenames) {
    for (const model of models) {
      try {
        const formData = new FormData();
        const blob = new Blob([buffer], { type: filename.endsWith('.wav') ? 'audio/wav' : filename.endsWith('.webm') ? 'audio/webm' : 'audio/mp4' });
        formData.append('file', blob, filename);
        formData.append('model', model);

        const res = await fetch('https://api.sarvam.ai/speech-to-text', {
          method: 'POST',
          headers: { 'api-subscription-key': API_KEY },
          body: formData,
        });

        console.log(`[Filename: ${filename}, Model: ${model}] Status: ${res.status}`);
        const text = await res.text();
        console.log(`   Response: ${text.substring(0, 150)}`);
      } catch (err) {
        console.error(`[Filename: ${filename}, Model: ${model}] Error:`, err.message);
      }
    }
  }
}

testFormats();
