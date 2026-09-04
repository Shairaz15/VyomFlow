import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';

const API_KEY = process.env.SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';
const PORT = process.env.PORT || 5001;

const server = createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-subscription-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'Sarvam STT WebSocket & Translate Proxy', port: PORT }));
    return;
  }

  // REST API STT / Translate Proxy endpoint
  if ((req.url === '/api/transcribe' || req.url === '/api/translate') && req.method === 'POST') {
    let body = [];
    req.on('data', (chunk) => body.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(body);
        const targetEndpoint = req.url === '/api/translate'
          ? 'https://api.sarvam.ai/speech-to-text-translate'
          : 'https://api.sarvam.ai/speech-to-text';

        console.log(`[Proxy REST] Forwarding to ${targetEndpoint}`);

        const response = await fetch(targetEndpoint, {
          method: 'POST',
          headers: {
            'api-subscription-key': API_KEY,
            'content-type': req.headers['content-type'] || 'multipart/form-data',
          },
          body: buffer,
        });

        const data = await response.json();
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.error('REST STT Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  // REST API TTS Proxy endpoint
  if (req.url === '/api/tts' && req.method === 'POST') {
    let body = [];
    req.on('data', (chunk) => body.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(body);
        const payload = JSON.parse(buffer.toString());
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'api-subscription-key': req.headers['api-subscription-key'] || API_KEY,
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        console.error('REST TTS Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

wss.on('connection', (browserWs, req) => {
  const reqUrl = url.parse(req.url, true);
  const model = reqUrl.query.model || 'saaras:v4';
  const languageCode = reqUrl.query['language-code'] || 'unknown';
  const mode = reqUrl.query.mode || 'transcribe';
  const sampleRate = reqUrl.query.sample_rate || '16000';
  const apiKeyOverride = reqUrl.query.api_key || API_KEY;

  const targetUrl = `wss://api.sarvam.ai/speech-to-text/ws?model=${model}&language-code=${languageCode}&mode=${mode}&sample_rate=${sampleRate}`;

  console.log(`[Proxy WS] Connecting client (mode=${mode}, lang=${languageCode}) to Sarvam STT: ${targetUrl}`);

  const sarvamWs = new WebSocket(targetUrl, {
    headers: {
      'Api-Subscription-Key': apiKeyOverride,
    },
  });

  sarvamWs.on('open', () => {
    console.log(`[Proxy WS] Connected to Sarvam AI WebSocket (mode=${mode}).`);
    browserWs.send(JSON.stringify({ type: 'proxy_connected', message: `Connected to Sarvam STT (mode=${mode})` }));
  });

  sarvamWs.on('message', (data) => {
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.send(data.toString());
    }
  });

  sarvamWs.on('error', (err) => {
    console.error('[Proxy WS] Sarvam WS Error:', err.message);
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.send(JSON.stringify({ type: 'error', data: { error: err.message } }));
    }
  });

  sarvamWs.on('close', (code, reason) => {
    console.log(`[Proxy WS] Sarvam WS closed: ${code} - ${reason.toString()}`);
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
    console.log('[Proxy WS] Browser client disconnected.');
    if (sarvamWs.readyState === WebSocket.OPEN) {
      sarvamWs.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sarvam AI STT Proxy Server running on http://localhost:${PORT}`);
  console.log(`   WebSocket Proxy: ws://localhost:${PORT}`);
  console.log(`   REST Transcribe: http://localhost:${PORT}/api/transcribe`);
  console.log(`   REST Translate:  http://localhost:${PORT}/api/translate`);
});
