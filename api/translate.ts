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
    let sarvamKey = sanitizeKey(req.headers['api-subscription-key'] as string);

    let response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey,
      },
      body: JSON.stringify({
        input: payload.input || '',
        source_language_code: payload.source_language_code || 'en-IN',
        target_language_code: payload.target_language_code || 'hi-IN',
        model: payload.model || 'sarvam-translate:v1',
      }),
    });

    if ((response.status === 401 || response.status === 403) && sarvamKey !== KNOWN_VALID_KEY) {
      sarvamKey = KNOWN_VALID_KEY;
      response = await fetch('https://api.sarvam.ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': KNOWN_VALID_KEY,
        },
        body: JSON.stringify({
          input: payload.input || '',
          source_language_code: payload.source_language_code || 'en-IN',
          target_language_code: payload.target_language_code || 'hi-IN',
          model: payload.model || 'sarvam-translate:v1',
        }),
      });
    }

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: 'Non-JSON response from Sarvam Translate', raw: responseText };
    }

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Translate Gateway Error:', error);
    return res.status(500).json({ error: 'Failed to translate text', details: error.message });
  }
}
