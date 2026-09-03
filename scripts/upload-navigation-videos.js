import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...rest] = trimmed.split('=');
                process.env[key.trim()] = rest.join('=').trim();
            }
        }
    }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function uploadVideo() {
    const videoFile = path.resolve(process.cwd(), 'public/videos/navigation/encoding_full.mp4');
    console.log(`Reading ${videoFile}...`);
    const fileBuffer = fs.readFileSync(videoFile);
    const sizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`Uploading encoding_full.mp4 (${sizeMb} MB) to Supabase Storage bucket 'navigation-assets'...`);

    const { data, error } = await supabase.storage
        .from('navigation-assets')
        .upload('videos/encoding_full.mp4', fileBuffer, {
            contentType: 'video/mp4',
            upsert: true
        });

    if (error) {
        console.error("Upload error:", error);
        process.exit(1);
    }

    const { data: publicUrlData } = supabase.storage
        .from('navigation-assets')
        .getPublicUrl('videos/encoding_full.mp4');

    console.log(`✅ Upload Successful! CDN URL: ${publicUrlData.publicUrl}`);
}

uploadVideo().catch(console.error);
