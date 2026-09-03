import fs from 'fs';

const SARVAM_API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

async function testBase64HandlerLogic() {
  console.log('Testing Base64 JSON Vercel Serverless Function logic...');

  // Create 16kHz WAV header + 1 sec PCM audio buffer
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

  const base64Audio = buffer.toString('base64');

  // Server-side logic inside api/sarvam-stt.ts
  const audioBuffer = Buffer.from(base64Audio, 'base64');
  const blob = new Blob([audioBuffer], { type: 'audio/wav' });

  const formData = new FormData();
  formData.append('file', blob, 'spoken_speech.wav');
  formData.append('model', 'saaras:v4');
  formData.append('mode', 'transcribe');

  const res = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: formData,
  });

  console.log('Sarvam STT Base64 Handler Status:', res.status);
  const data = await res.json();
  console.log('Sarvam STT Base64 Handler Response:', data);
}

testBase64HandlerLogic();
