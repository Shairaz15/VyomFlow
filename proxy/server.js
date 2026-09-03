import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';

const API_KEY = process.env.SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';
const PORT = process.env.PORT || 5001;

// Allowed origins (add your Vercel domain)
const ALLOWED_ORIGINS = [
  'https://biomed-rho.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '*';

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-subscription-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'VyomFlow Sarvam AI Proxy',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // REST API Proxy: Text to Speech (/api/tts)
  if (req.method === 'POST' && req.url === '/api/tts') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': req.headers['api-subscription-key'] || API_KEY
          },
          body: JSON.stringify({
            inputs: payload.inputs || [payload.text],
            target_language_code: payload.target_language_code || payload.language_code || 'en-IN',
            speaker: payload.speaker || 'priya',
            pace: payload.pace || 1.0,
            speech_sample_rate: payload.speech_sample_rate || 22050,
            model: payload.model || 'bulbul:v3'
          })
        });

        const data = await sarvamRes.json();
        res.writeHead(sarvamRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.error('[Proxy] TTS Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // REST API Proxy: Translate (/api/translate)
  if (req.method === 'POST' && req.url === '/api/translate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const sarvamRes = await fetch('https://api.sarvam.ai/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': req.headers['api-subscription-key'] || API_KEY
          },
          body: JSON.stringify({
            input: payload.input || payload.text,
            source_language_code: payload.source_language_code || 'en-IN',
            target_language_code: payload.target_language_code || 'hi-IN',
            model: payload.model || 'sarvam-translate:v1'
          })
        });

        const data = await sarvamRes.json();
        res.writeHead(sarvamRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.error('[Proxy] Translate Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (browserWs, req) => {
  const reqUrl = url.parse(req.url, true);
  const model = reqUrl.query.model || 'saaras:v4';
  const languageCode = reqUrl.query['language-code'] || 'unknown';
  const mode = reqUrl.query.mode || 'transcribe';
  const sampleRate = reqUrl.query.sample_rate || '16000';
  const apiKeyOverride = reqUrl.query.api_key || API_KEY;

  const targetUrl = `wss://api.sarvam.ai/speech-to-text/ws?model=${model}&language-code=${languageCode}&mode=${mode}&sample_rate=${sampleRate}`;

  console.log(`[Proxy] New client (mode=${mode}, lang=${languageCode}) → ${targetUrl}`);

  const sarvamWs = new WebSocket(targetUrl, {
    headers: { 'Api-Subscription-Key': apiKeyOverride },
  });

  sarvamWs.on('open', () => {
    console.log(`[Proxy] Connected to Sarvam AI (mode=${mode})`);
    browserWs.send(JSON.stringify({ type: 'proxy_connected', message: `Connected (mode=${mode})` }));
  });

  sarvamWs.on('message', (data) => {
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.send(data.toString());
    }
  });

  sarvamWs.on('error', (err) => {
    console.error('[Proxy] Sarvam WS Error:', err.message);
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.send(JSON.stringify({ type: 'error', data: { error: err.message } }));
    }
  });

  sarvamWs.on('close', (code, reason) => {
    console.log(`[Proxy] Sarvam WS closed: ${code}`);
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.close(code, reason.toString());
    }
  });

  browserWs.on('message', (data) => {
    if (sarvamWs.readyState === WebSocket.OPEN) {
      sarvamWs.send(data.toString());
    }
  });

  browserWs.on('close', () => {
    console.log('[Proxy] Browser client disconnected');
    if (sarvamWs.readyState === WebSocket.OPEN) {
      sarvamWs.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 VyomFlow Sarvam Proxy running on port ${PORT}`);
});
