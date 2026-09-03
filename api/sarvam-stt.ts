import type { VercelRequest, VercelResponse } from '@vercel/node';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
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
    const { audioBase64, mimeType, model = 'saaras:v4', mode = 'transcribe' } = req.body || {};

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 in request body' });
    }

    // Convert Base64 back to Buffer
    const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    // Determine extension from mimeType
    let ext = 'webm';
    if (mimeType && mimeType.includes('mp4')) ext = 'mp4';
    else if (mimeType && mimeType.includes('aac')) ext = 'aac';
    else if (mimeType && mimeType.includes('wav')) ext = 'wav';

    const filename = `speech_audio.${ext}`;
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });

    // Construct server-side FormData
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('model', model);
    formData.append('mode', mode);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Sarvam STT Vercel Function Error:', error);
    return res.status(500).json({ error: 'Failed to process audio with Sarvam AI', details: error.message });
  }
}
