import WebSocket from 'ws';

const API_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

console.log('Testing Sarvam STT WebSocket with mode=translate...');

// Test 1: saaras:v4 with mode=translate
const wsUrl1 = 'wss://api.sarvam.ai/speech-to-text/ws?model=saaras:v4&language-code=hi-IN&mode=translate&sample_rate=16000';
console.log('Connecting to:', wsUrl1);

const ws1 = new WebSocket(wsUrl1, {
  headers: { 'Api-Subscription-Key': API_KEY },
});

ws1.on('open', () => {
  console.log('✅ Connected to Sarvam WS (mode=translate)');
  ws1.send(JSON.stringify({ type: 'flush' }));
});

ws1.on('message', (raw) => {
  console.log('📩 Response (mode=translate):', raw.toString());
  ws1.close();
});

ws1.on('error', (err) => {
  console.error('❌ WS Error:', err.message);
});

// Test 2: Check REST API Translate endpoint (https://api.sarvam.ai/speech-to-text-translate or POST to speech-to-text)
async function testRestTranslate() {
  try {
    const res = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
      method: 'POST',
      headers: { 'api-subscription-key': API_KEY },
    });
    console.log('REST speech-to-text-translate status:', res.status);
    const text = await res.text();
    console.log('REST speech-to-text-translate body:', text.substring(0, 200));
  } catch (err) {
    console.error('REST translate test error:', err.message);
  }
}

testRestTranslate();
