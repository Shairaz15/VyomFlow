import WebSocket from 'ws';

const API_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';
const URL = 'wss://api.sarvam.ai/speech-to-text/ws?model=saaras:v4&language-code=unknown&mode=verbatim&sample_rate=16000';

console.log('Testing Sarvam STT WebSocket with mode=verbatim...');
console.log('URL:', URL);

const ws = new WebSocket(URL, {
  headers: { 'Api-Subscription-Key': API_KEY },
});

ws.on('open', () => {
  console.log('✅ Connected to Sarvam STT WebSocket (mode=verbatim)!');
  ws.send(JSON.stringify({ type: 'flush' }));
});

ws.on('message', (raw) => {
  console.log('📩 Message (mode=verbatim):', raw.toString());
  ws.close();
});

ws.on('error', (err) => {
  console.error('❌ WS Error:', err.message);
});
