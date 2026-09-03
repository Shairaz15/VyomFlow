import fs from 'fs';

const API_KEY = 'sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad';

// Create a minimal 1-second 16kHz mono WAV file
function createWavHeader(sampleRate = 16000, numChannels = 1, bitsPerSample = 16, numSamples = 16000) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const chunkSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate 440Hz sine wave PCM data
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 10000;
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
  }

  return buffer;
}

async function testSarvamTranslate() {
  const wavBuffer = createWavHeader();
  fs.writeFileSync('test_audio.wav', wavBuffer);
  console.log('Generated test_audio.wav (size:', wavBuffer.length, 'bytes)');

  // Test 1: REST API speech-to-text-translate
  console.log('\n--- Testing REST API: https://api.sarvam.ai/speech-to-text-translate ---');
  try {
    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'test_audio.wav');
    formData.append('model', 'saaras:v4');

    const res = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
      method: 'POST',
      headers: { 'api-subscription-key': API_KEY },
      body: formData,
    });

    console.log('REST Translate Status:', res.status);
    const data = await res.json();
    console.log('REST Translate Response:', data);
  } catch (err) {
    console.error('REST Translate Error:', err);
  }

  // Test 2: REST API speech-to-text with mode or parameters
  console.log('\n--- Testing REST API: https://api.sarvam.ai/speech-to-text ---');
  try {
    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'test_audio.wav');
    formData.append('model', 'saaras:v4');
    formData.append('mode', 'translate');

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': API_KEY },
      body: formData,
    });

    console.log('REST STT (mode=translate) Status:', res.status);
    const data = await res.json();
    console.log('REST STT Response:', data);
  } catch (err) {
    console.error('REST STT Error:', err);
  }
}

testSarvamTranslate();
