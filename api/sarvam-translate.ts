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
    const payload = req.body || {};
    const sarvamKey = sanitizeKey(req.headers['api-subscription-key'] as string);

    // Case 1: Text translation (e.g. from LanguageAssessment or StoryRecorder)
    if (payload.input !== undefined || payload.inputs !== undefined) {
      const response = await fetch('https://api.sarvam.ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': sarvamKey,
        },
        body: JSON.stringify({
          input: payload.input || (Array.isArray(payload.inputs) ? payload.inputs.join(' ') : ''),
          source_language_code: payload.source_language_code || 'hi-IN',
          target_language_code: payload.target_language_code || 'en-IN',
          model: payload.model || 'sarvam-translate:v1',
          mode: payload.mode || 'formal',
        }),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Case 2: Speech-to-text audio translation
    const { audioBase64, mimeType, model = 'saaras:v3', language_code } = payload;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing input (text) or audioBase64 in request body' });
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
    if (language_code && language_code !== 'unknown' && language_code !== 'Auto-detecting...' && language_code !== 'Listening...') {
      formData.append('language_code', language_code);
    }

    const response = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey,
      },
      body: formData,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Sarvam Translate Vercel Function Error:', error);
    return res.status(500).json({ error: 'Failed to translate with Sarvam AI', details: error.message });
  }
}
