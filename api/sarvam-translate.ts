import type { VercelRequest, VercelResponse } from '@vercel/node';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

export const config = {
  api: {
    bodyParser: false, // Disable Vercel body parser to stream raw audio file
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for browser security
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
    // Collect raw request body chunks
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || 'multipart/form-data';

    // Forward raw audio multipart request to Sarvam STT Translate REST API
    const response = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'content-type': contentType,
      },
      body: buffer,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Sarvam Translate Vercel Function Error:', error);
    return res.status(500).json({ error: 'Failed to translate audio with Sarvam AI', details: error.message });
  }
}
