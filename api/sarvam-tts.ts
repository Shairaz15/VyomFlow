import type { VercelRequest, VercelResponse } from '@vercel/node';

const KNOWN_VALID_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || KNOWN_VALID_KEY;

function sanitizeKey(key?: string | string[]): string {
  if (!key || typeof key !== 'string') return SARVAM_API_KEY;
  const clean = key.trim();
  if (clean.startsWith('sk_bl9') || clean.length < 20) {
    return SARVAM_API_KEY;
  }
  return clean;
}

async function parseBody(req: VercelRequest): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch { return {}; }
    }
    if (Buffer.isBuffer(req.body)) {
      try { return JSON.parse(req.body.toString('utf-8')); } catch { return {}; }
    }
    return req.body;
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api-subscription-key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = await parseBody(req);

    if (!payload.inputs || !Array.isArray(payload.inputs) || payload.inputs.length === 0) {
      return res.status(400).json({ error: 'Missing inputs array in request body' });
    }

    let sarvamKey = sanitizeKey(req.headers['api-subscription-key'] as string);

    let response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey,
      },
      body: JSON.stringify({
        inputs: payload.inputs,
        target_language_code: payload.target_language_code || 'en-IN',
        speaker: payload.speaker || 'priya',
        model: payload.model || 'bulbul:v3',
        pace: payload.pace || 0.85,
        speech_sample_rate: payload.speech_sample_rate || 16000,
      }),
    });

    if ((response.status === 401 || response.status === 403) && sarvamKey !== KNOWN_VALID_KEY) {
      console.warn('[api/sarvam-tts] Initial key unauthorized, falling back to known key...');
      sarvamKey = KNOWN_VALID_KEY;
      response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': KNOWN_VALID_KEY,
        },
        body: JSON.stringify({
          inputs: payload.inputs,
          target_language_code: payload.target_language_code || 'en-IN',
          speaker: payload.speaker || 'priya',
          model: payload.model || 'bulbul:v3',
          pace: payload.pace || 0.85,
          speech_sample_rate: payload.speech_sample_rate || 22050,
        }),
      });
    }

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: 'Non-JSON response from Sarvam AI', raw: responseText };
    }

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Sarvam TTS Gateway Error:', error);
    return res.status(500).json({ error: 'Failed to synthesize speech', details: error.message });
  }
}
