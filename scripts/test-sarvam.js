import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.VITE_SARVAM_API_KEY || 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';
const URL = 'wss://api.sarvam.ai/speech-to-text/ws?model=saaras:v4&language-code=unknown&mode=transcribe&sample_rate=16000';

console.log('Testing Sarvam AI WebSocket Connection...');
console.log('URL:', URL);
console.log('API Key:', API_KEY.substring(0, 8) + '...');

const ws = new WebSocket(URL, {
  headers: {
    'Api-Subscription-Key': API_KEY,
  },
});

ws.on('open', () => {
  console.log('✅ WebSocket Connected successfully to Sarvam AI!');
  ws.send(JSON.stringify({ type: 'flush' }));
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  console.log('📩 Message from Sarvam:', msg);
  if (msg.type === 'data' || msg.type === 'error') {
    ws.close();
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed (code: ${code}, reason: ${reason || 'normal'})`);
});
