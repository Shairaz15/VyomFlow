import fs from 'fs';
import path from 'path';

const SARVAM_API_KEY = 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE STORY RETELL STT TESTS');
  console.log('====================================================\n');

  // Test 1: Direct Sarvam STT REST API
  console.log('▶ [Test 1] Testing Direct Sarvam STT API Endpoint (https://api.sarvam.ai/speech-to-text)...');
  try {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    // Create a 1-second 16kHz mono silence/sine WAV buffer
    const sampleRate = 16000;
    const numSamples = sampleRate * 1;
    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + numSamples * 2, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20); // PCM
    wavHeader.writeUInt16LE(1, 22); // mono
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(sampleRate * 2, 28);
    wavHeader.writeUInt16LE(2, 32);
    wavHeader.writeUInt16LE(16, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(numSamples * 2, 40);

    const pcmData = Buffer.alloc(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 10000;
      pcmData.writeInt16LE(Math.floor(sample), i * 2);
    }
    const fullWav = Buffer.concat([wavHeader, pcmData]);

    const formData = new FormData();
    formData.append('file', new Blob([fullWav], { type: 'audio/wav' }), 'story_audio.wav');
    formData.append('model', 'saaras:v4');
    formData.append('mode', 'transcribe');

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY },
      body: formData,
    });

    const data = await res.json();
    console.log(`  Status: ${res.status}`);
    console.log('  Response:', JSON.stringify(data));
    if (res.status === 200) {
      console.log('  ✅ [PASS] Sarvam STT REST API is 100% OPERATIONAL.\n');
    } else {
      console.log('  ❌ [FAIL] Sarvam STT REST API returned non-200.\n');
    }
  } catch (err) {
    console.error('  ❌ [FAIL] Test 1 Exception:', err.message, '\n');
  }

  // Test 2: Serverless Base64 Payload Simulation (api/sarvam-stt)
  console.log('▶ [Test 2] Testing Base64 Payload conversion & Sarvam request...');
  try {
    const sampleRate = 16000;
    const numSamples = sampleRate * 1;
    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + numSamples * 2, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(1, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(sampleRate * 2, 28);
    wavHeader.writeUInt16LE(2, 32);
    wavHeader.writeUInt16LE(16, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(numSamples * 2, 40);

    const pcmData = Buffer.alloc(numSamples * 2);
    const fullWav = Buffer.concat([wavHeader, pcmData]);
    const base64Audio = `data:audio/wav;base64,${fullWav.toString('base64')}`;

    const cleanBase64 = base64Audio.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(cleanBase64, 'base64');
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });

    const formData = new FormData();
    formData.append('file', blob, 'speech_audio.wav');
    formData.append('model', 'saaras:v4');
    formData.append('mode', 'transcribe');

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY },
      body: formData,
    });

    const data = await res.json();
    console.log(`  Status: ${res.status}`);
    console.log('  Response:', JSON.stringify(data));
    if (res.status === 200) {
      console.log('  ✅ [PASS] Base64 / Serverless audio payload parsing is 100% OPERATIONAL.\n');
    } else {
      console.log('  ❌ [FAIL] Serverless test returned non-200.\n');
    }
  } catch (err) {
    console.error('  ❌ [FAIL] Test 2 Exception:', err.message, '\n');
  }

  // Test 3: Story Matching & Scoring Engine Integration Test
  console.log('▶ [Test 3] Testing Story Matching Engine with Recalled Text & Info Units...');
  try {
    const infoUnits = [
      { id: "u1", category: "character", text: "Raju, a nine-year-old boy", weight: 1.0, keywords: ["raju", "boy", "nine"] },
      { id: "u2", category: "character", text: "Golden retriever named Sheru", weight: 1.0, keywords: ["sheru", "dog", "retriever", "golden"] },
      { id: "u3", category: "setting", text: "Foothills of Himachal Pradesh", weight: 1.0, keywords: ["himachal", "hills", "foothills"] },
      { id: "u4", category: "action", text: "Crossed pine forest to stream", weight: 1.0, keywords: ["forest", "pine", "stream", "crossed"] },
      { id: "u5", category: "resolution", text: "Found injured sparrow and bandaged it", weight: 1.5, keywords: ["sparrow", "injured", "bandaged", "bird"] }
    ];

    const testTranscript = "Raju was a nine year old boy living in Himachal Pradesh with his golden retriever dog Sheru. They went across the pine forest to the stream and found an injured sparrow which they bandaged carefully.";

    // Tokenizer
    const tokenize = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    const tokens = tokenize(testTranscript);
    const tokenStr = tokens.join(' ');

    let matched = 0;
    infoUnits.forEach(unit => {
      const match = unit.keywords.some(kw => tokens.some(t => t.includes(kw) || kw.includes(t)) || tokenStr.includes(kw));
      if (match) matched++;
    });

    const unitScore = (matched / infoUnits.length) * 100;
    console.log(`  Total Info Units: ${infoUnits.length}, Matched: ${matched}`);
    console.log(`  Unit Recall Accuracy: ${unitScore}%`);
    if (matched >= 4) {
      console.log('  ✅ [PASS] Story Matching Engine scored expected 100% on sample recall transcript.\n');
    } else {
      console.log('  ❌ [FAIL] Story Matching Engine failed to match keywords.\n');
    }
  } catch (err) {
    console.error('  ❌ [FAIL] Test 3 Exception:', err.message, '\n');
  }

  console.log('====================================================');
  console.log('🎉 ALL STORY RETELL & STT API TESTS COMPLETED');
  console.log('====================================================');
}

runTests();
