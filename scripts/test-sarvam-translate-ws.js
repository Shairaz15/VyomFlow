import WebSocket from 'ws';

const API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

const modelsToTest = ['saaras:v4', 'saaras:v3', 'saaras:v2.5', 'saaras:v2', 'saaras:flash'];
const endpoints = [
  'wss://api.sarvam.ai/speech-to-text/ws',
  'wss://api.sarvam.ai/speech-to-text-translate/ws',
];

async function testWsTranslation() {
  for (const endpoint of endpoints) {
    for (const model of modelsToTest) {
      const url = `${endpoint}?model=${model}&language-code=unknown&mode=translate&sample_rate=16000`;
      console.log(`\nTesting: ${url}`);
      await new Promise((resolve) => {
        const ws = new WebSocket(url, {
          headers: { 'Api-Subscription-Key': API_KEY },
        });
        const timeout = setTimeout(() => {
          console.log('⏰ Timeout');
          ws.close();
          resolve(null);
        }, 3000);

        ws.on('open', () => {
          console.log('✅ WS OPEN SUCCESS');
          ws.send(JSON.stringify({ type: 'flush' }));
        });

        ws.on('message', (data) => {
          console.log('📩 Message:', data.toString());
          clearTimeout(timeout);
          ws.close();
          resolve(null);
        });

        ws.on('error', (err) => {
          console.log('❌ Error:', err.message);
          clearTimeout(timeout);
          resolve(null);
        });
      });
    }
  }
}

testWsTranslation();
