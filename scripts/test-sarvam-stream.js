import WebSocket from 'ws';

const API_KEY = process.env.VITE_SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';
const URL = 'wss://api.sarvam.ai/speech-to-text/ws?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000';

console.log('Connecting to Sarvam WebSocket...');
const ws = new WebSocket(URL, {
  headers: {
    'Api-Subscription-Key': API_KEY,
  },
});

ws.on('open', () => {
  console.log('✅ WebSocket Connected!');
  // Create 1 second of dummy 16kHz PCM audio
  const sampleRate = 16000;
  const numSamples = sampleRate; // 1 second
  const buffer = new Int16Array(numSamples);
  // Helper to create a proper 16kHz mono 16-bit PCM WAV buffer
  const createWavBuffer = (pcmSamples, sampleRate = 16000) => {
    const buffer = new ArrayBuffer(44 + pcmSamples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcmSamples.length * 2, true); // file length - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, pcmSamples.length * 2, true); // data size

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < pcmSamples.length; i++, offset += 2) {
      view.setInt16(offset, pcmSamples[i], true);
    }
    return Buffer.from(buffer);
  };

  const wavBuffer = createWavBuffer(buffer, sampleRate);
  const base64 = wavBuffer.toString('base64');
  
  const payload = JSON.stringify({
    audio: {
      data: base64,
      sample_rate: '16000',
      encoding: 'audio/wav',
    },
  });

  console.log('Sending 1 second PCM audio frame...');
  ws.send(payload);

  setTimeout(() => {
    console.log('Sending flush...');
    ws.send(JSON.stringify({ type: 'flush' }));
  }, 1000);
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  console.log('📩 Message from Sarvam:', msg);
  if (msg.type === 'data') {
    console.log('Transcript:', msg.data?.transcript);
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Closed (${code}): ${reason}`);
  process.exit(0);
});
