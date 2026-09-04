import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const sarvamKey = sanitizeKey(req.headers['api-subscription-key'] as string);
    const contentType = req.headers['content-type'] || 'multipart/form-data';

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const response = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'api-subscription-key': sarvamKey,
      },
      body: bodyBuffer,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Sarvam STT Translate Vercel Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to translate speech with Sarvam AI', details: error.message });
  }
}
