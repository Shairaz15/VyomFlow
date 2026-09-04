import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables
function loadEnv() {
    const envPath = path.resolve(rootDir, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...vals] = trimmed.split('=');
        if (key) env[key.trim()] = vals.join('=').trim();
    }
    return env;
}

const env = loadEnv();
const SARVAM_KEY = env.SARVAM_API_KEY || env.VITE_SARVAM_API_KEY || 'sk_jyptjv87_fsK6fkisYocrdYabftZOapZl';

function extractCleanSentences(text) {
    if (!text) return [];
    const sanitized = text
        .replace(/Mr\./gi, 'Mr')
        .replace(/Mrs\./gi, 'Mrs')
        .replace(/Ms\./gi, 'Ms')
        .replace(/Dr\./gi, 'Dr')
        .replace(/Prof\./gi, 'Prof')
        .replace(/Shri\./gi, 'Shri')
        .replace(/Smt\./gi, 'Smt');

    const rawMatches = sanitized.match(/[^.!?|।\n]+[.!?|।]*(\s+|$)/g);
    if (!rawMatches || rawMatches.length === 0) return [sanitized.trim()];

    const result = [];
    for (const chunk of rawMatches) {
        const trimmed = chunk.trim();
        if (!trimmed || !/[\p{L}\p{N}]/u.test(trimmed)) continue;
        if (result.length > 0 && trimmed.length < 8) {
            result[result.length - 1] = result[result.length - 1] + ' ' + trimmed;
        } else {
            result.push(trimmed);
        }
    }
    return result.length > 0 ? result : [text.trim()];
}

async function fetchSarvamTTS(text, langCode) {
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_KEY
        },
        body: JSON.stringify({
            inputs: [text],
            target_language_code: langCode,
            speaker: 'priya',
            model: 'bulbul:v3',
            pace: 0.88,
            speech_sample_rate: 16000,
            enable_preprocessing: true
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.audios?.[0] || data.audio;
}

async function main() {
    console.log('====================================================');
    console.log('  PRE-GENERATING STORY AUDIO WITH SARVAM AI (TTS)  ');
    console.log('====================================================');
    console.log(`Using Sarvam Key: ${SARVAM_KEY.slice(0, 10)}...`);

    const { STORIES } = await import('../src/data/stories/storyData.ts');
    const audioDir = path.resolve(rootDir, 'public', 'audio', 'stories');
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    const manifest = {};
    let totalSynthesized = 0;
    let totalBytes = 0;

    for (const story of STORIES) {
        console.log(`\nProcessing Story: ${story.id} (${story.title})`);
        manifest[story.id] = {};
        const storySubDir = path.resolve(audioDir, story.id);
        if (!fs.existsSync(storySubDir)) {
            fs.mkdirSync(storySubDir, { recursive: true });
        }

        const languages = Object.keys(story.content);

        for (const lang of languages) {
            const text = story.content[lang];
            const sentences = extractCleanSentences(text);
            manifest[story.id][lang] = [];
            process.stdout.write(`  [${lang}] (${sentences.length} sentences)... `);

            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i];
                const filename = `${lang}_${i}.wav`;
                const filePath = path.resolve(storySubDir, filename);
                const relativeUrl = `/audio/stories/${story.id}/${filename}`;

                // Check if already exists to allow idempotent re-runs
                if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
                    manifest[story.id][lang].push({
                        text: sentence,
                        audioUrl: relativeUrl
                    });
                    continue;
                }

                try {
                    const base64Audio = await fetchSarvamTTS(sentence, lang);
                    if (base64Audio) {
                        const buffer = Buffer.from(base64Audio, 'base64');
                        fs.writeFileSync(filePath, buffer);
                        totalBytes += buffer.length;
                        totalSynthesized++;

                        manifest[story.id][lang].push({
                            text: sentence,
                            audioUrl: relativeUrl
                        });
                    } else {
                        console.error(`\n    ❌ Empty audio returned for ${lang}_${i}`);
                    }
                } catch (err) {
                    console.error(`\n    ❌ Error on ${lang}_${i}:`, err.message);
                }

                // Gentle delay between requests to respect rate limits
                await new Promise(r => setTimeout(r, 120));
            }
            console.log('✅ Done');
        }
    }

    // Write TypeScript manifest into src/data/stories/storyAudioManifest.ts
    const manifestTsPath = path.resolve(rootDir, 'src', 'data', 'stories', 'storyAudioManifest.ts');
    const tsContent = `// Auto-generated Sarvam AI (Bulbul v3 - Priya) Pre-rendered Audio Manifest
// Generated on: ${new Date().toISOString()}
// Total synthesized audio clips: ${totalSynthesized}

export interface StoryAudioTrack {
    text: string;
    audioUrl: string;
}

export type StoryAudioManifest = Record<string, Record<string, StoryAudioTrack[]>>;

export const STORY_AUDIO_MANIFEST: StoryAudioManifest = ${JSON.stringify(manifest, null, 4)};

/**
 * Returns pre-synthesized Sarvam audio tracks if available for the given story & language.
 * Returns null if not pre-rendered (triggers dynamic Sarvam TTS fallback).
 */
export function getPreRenderedStoryTracks(storyId: string, languageCode: string): StoryAudioTrack[] | null {
    const storyTracks = STORY_AUDIO_MANIFEST[storyId];
    if (!storyTracks) return null;
    const tracks = storyTracks[languageCode];
    if (tracks && tracks.length > 0) return tracks;
    return null;
}
`;

    fs.writeFileSync(manifestTsPath, tsContent, 'utf8');
    console.log(`\n====================================================`);
    console.log(`🎉 Audio Pre-generation Complete!`);
    console.log(`   Clips generated: ${totalSynthesized}`);
    console.log(`   Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Manifest written to: ${manifestTsPath}`);
    console.log(`====================================================`);
}

main().catch(err => {
    console.error('Fatal error in audio generation:', err);
    process.exit(1);
});
