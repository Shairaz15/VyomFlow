import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get static ffmpeg exe from python imageio_ffmpeg
const ffmpegExe = execSync('python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe(), end=\'\')"').toString().trim();
console.log(`Using FFmpeg: ${ffmpegExe}`);

const landmarksDir = path.resolve(process.cwd(), 'public/images/navigation/landmarks');
const uploadResults = [];

async function processLandmarks() {
    console.log("📸 Optimizing and Uploading 21 Landmark Images to Supabase CDN...\n");

    for (let i = 1; i <= 21; i++) {
        const filename = `landmark_${i}.jpg`;
        const localPath = path.join(landmarksDir, filename);
        const tempPath = path.join(landmarksDir, `temp_${filename}`);

        if (!fs.existsSync(localPath)) {
            console.warn(`File not found: ${localPath}`);
            continue;
        }

        const origSize = fs.statSync(localPath).size / 1024;

        // Optimize with FFmpeg
        const cmd = `"${ffmpegExe}" -y -i "${localPath}" -vf "scale='min(1080,iw)':-2" -q:v 4 "${tempPath}"`;
        execSync(cmd, { stdio: 'pipe' });

        const optSize = fs.statSync(tempPath).size / 1024;
        const buffer = fs.readFileSync(tempPath);

        // Upload to Supabase Storage
        const storagePath = `landmarks/${filename}`;
        const { data, error } = await supabase.storage
            .from('navigation-assets')
            .upload(storagePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.error(`❌ Failed to upload ${filename}:`, error);
        } else {
            const { data: urlData } = supabase.storage
                .from('navigation-assets')
                .getPublicUrl(storagePath);
            
            console.log(`✅ [${i}/21] ${filename}: ${origSize.toFixed(0)}KB → ${optSize.toFixed(0)}KB | CDN: ${urlData.publicUrl}`);
            uploadResults.push({ id: `lm_${i.toString().padStart(2, '0')}`, filename, url: urlData.publicUrl });
        }

        // Overwrite local file with optimized version and clean up temp
        fs.unlinkSync(tempPath);
        fs.writeFileSync(localPath, buffer);
    }

    console.log(`\n🎉 All ${uploadResults.length}/21 Landmark Images are live on Supabase Storage Global CDN!`);
}

processLandmarks().catch(console.error);
