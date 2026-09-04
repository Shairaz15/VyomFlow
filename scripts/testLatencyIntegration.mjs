import { getCachedTTS, setCachedTTS, getCachedTranslation, setCachedTranslation } from '../src/utils/aiCache.ts';

console.log('====================================================');
console.log('    RUNNING LATENCY INTEGRATION VALIDATION TEST     ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, name) {
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        passCount++;
    } else {
        console.error(`❌ FAIL: ${name}`);
        failCount++;
    }
}

// 1. Validate aiCache logic
console.log('[Suite 1: aiCache In-Memory & Storage Tier]');
assert(getCachedTTS('Hello World', 'en-IN') === null, 'Cache misses on empty initial entry');

setCachedTTS('Remember these 3 objects', 'en-IN', 'b64_audio_sample_data', 'priya');
const hit = getCachedTTS('Remember these 3 objects', 'en-IN', 'priya');
assert(hit === 'b64_audio_sample_data', 'TTS Cache hit returns exact stored audio string');

// Normalized whitespace / case tolerance
const hitNormalized = getCachedTTS('  Remember   these 3 objects  ', 'en-IN', 'priya');
assert(hitNormalized === 'b64_audio_sample_data', 'TTS Cache hit normalizes whitespace and casing');

// Translation cache
assert(getCachedTranslation('Hello', 'en-IN', 'hi-IN') === null, 'Translation cache misses on empty');
setCachedTranslation('Hello', 'en-IN', 'hi-IN', 'नमस्ते');
assert(getCachedTranslation('Hello', 'en-IN', 'hi-IN') === 'नमस्ते', 'Translation cache hit returns translated text');

// 2. Validate index.html preconnect tags
console.log('\n[Suite 2: index.html Resource Hints]');
import fs from 'fs';
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('https://generativelanguage.googleapis.com'), 'index.html contains preconnect for Gemini API');
assert(indexHtml.includes('https://api.sarvam.ai'), 'index.html contains preconnect for Sarvam API');

// 3. Validate service model hierarchies
console.log('\n[Suite 3: Model Priority Configuration]');
const langServiceCode = fs.readFileSync('src/services/languageGeminiService.ts', 'utf8');
assert(langServiceCode.includes("'gemini-flash-lite-latest'"), 'languageGeminiService has gemini-flash-lite-latest');
const langFirstModelMatch = langServiceCode.match(/const GEMINI_MODELS = \[\s*'([^']+)'/);
assert(langFirstModelMatch && langFirstModelMatch[1] === 'gemini-flash-lite-latest', 'languageGeminiService priority model is gemini-flash-lite-latest');

const assistantCode = fs.readFileSync('src/services/aiAssistantService.ts', 'utf8');
const asstFirstModelMatch = assistantCode.match(/const GEMINI_MODELS = \[\s*'([^']+)'/);
assert(asstFirstModelMatch && asstFirstModelMatch[1] === 'gemini-flash-lite-latest', 'aiAssistantService priority model is gemini-flash-lite-latest');
assert(assistantCode.includes('speech_sample_rate: 16000'), 'aiAssistantService uses 16000 Hz sample rate');
assert(assistantCode.includes('getCachedTTS'), 'aiAssistantService integrates getCachedTTS');

const storyCode = fs.readFileSync('src/components/tests/story/StoryMatchingService.ts', 'utf8');
const storyFirstModelMatch = storyCode.match(/const GEMINI_MODELS = \[\s*'([^']+)'/);
assert(storyFirstModelMatch && storyFirstModelMatch[1] === 'gemini-flash-lite-latest', 'StoryMatchingService priority model is gemini-flash-lite-latest');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================');

if (failCount > 0) {
    process.exit(1);
}
