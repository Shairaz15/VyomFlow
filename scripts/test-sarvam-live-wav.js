import WebSocket from 'ws';

const API_KEY = process.env.VITE_SARVAM_API_KEY || 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';
const URL = 'wss://api.sarvam.ai/speech-to-text/ws?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000';

console.log('Connecting to Sarvam WebSocket...');
const ws = new WebSocket(URL, {
  headers: {
    'Api-Subscription-Key': API_KEY,
  },
});

ws.on('open', () => {
  console.log('✅ WebSocket Connected!');
  
  const sampleRate = 16000;
  const chunkSamples = 4096; // typical ScriptProcessor chunk
  const float32 = new Float32Array(chunkSamples);
  for (let i = 0; i < chunkSamples; i++) {
    float32[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
  }

  // Convert to WAV base64
  const numSamples = float32.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, sample, true);
  }

  const base64 = Buffer.from(buffer).toString('base64');
  const payload = JSON.stringify({
    audio: {
      data: base64,
      sample_rate: '16000',
      encoding: 'audio/wav',
    },
  });

  console.log('Sending WAV frame...');
  ws.send(payload);

  setTimeout(() => {
    console.log('Sending flush...');
    ws.send(JSON.stringify({ type: 'flush' }));
  }, 1000);
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  console.log('📩 Message from Sarvam:', msg);
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Closed (${code}): ${reason}`);
  process.exit(0);
});
