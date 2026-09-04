import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://pkkrxxjinpxctkoxltuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBra3J4eGppbnB4Y3Rrb3hsdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTUxNjMsImV4cCI6MjEwMzM5MTE2M30.eZ2Oj7ym61xITHJZANeCSRPZwv12v39blnfayNqQ5uM';
const password = 'fPBKjyKwTXI7vA9A';
const projectRef = 'pkkrxxjinpxctkoxltuy';
const bucketName = 'tutorial-videos';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LANGUAGE_MAP = {
    'english_indian': { code: 'en', label: 'English (Indian)' },
    'hindi': { code: 'hi', label: 'Hindi (हिंदी)' },
    'hindi_sarvam': { code: 'hi-sarvam', label: 'Hindi Sarvam' },
    'kannada': { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
    'tamil': { code: 'ta', label: 'Tamil (தமிழ்)' },
    'telugu': { code: 'te', label: 'Telugu (తెలుగు)' },
    'malayalam': { code: 'ml', label: 'Malayalam (മലയാളം)' },
    'marathi': { code: 'mr', label: 'Marathi (मराठी)' },
    'bengali': { code: 'bn', label: 'Bengali (বাংলা)' },
    'gujarati': { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
    'urdu': { code: 'ur', label: 'Urdu (اردو)' },
    'nepali': { code: 'ne', label: 'Nepali (नेपाली)' }
};

function extractLanguageSuffix(filename) {
    const withoutExt = filename.replace(/\.mp4$/, '');
    const parts = withoutExt.split('_tutorial_');
    if (parts.length > 1) {
        return parts[1];
    }
    return withoutExt;
}

async function getPgClient() {
    const client = new pg.Client({
        host: 'aws-0-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        user: `postgres.${projectRef}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    return client;
}

async function uploadAllVideosFast() {
    const pgClient = await getPgClient();
    console.log('✅ Connected to Supabase PostgreSQL!');

    // Fetch existing uploaded records to allow fast skip
    const existingRes = await pgClient.query('SELECT module_key, language_code, file_size_bytes FROM tutorial_videos;');
    const existingMap = new Set(existingRes.rows.map(r => `${r.module_key}:${r.language_code}:${r.file_size_bytes}`));

    const baseDir = path.resolve(process.cwd(), 'public/videos/tutorials');
    const modules = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());

    const tasks = [];

    for (const mod of modules) {
        const modPath = path.join(baseDir, mod);
        const files = fs.readdirSync(modPath).filter(f => f.endsWith('.mp4'));

        for (const file of files) {
            const filePath = path.join(modPath, file);
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            const storagePath = `${mod}/${file}`;
            const langSuffix = extractLanguageSuffix(file);
            const langInfo = LANGUAGE_MAP[langSuffix] || { code: langSuffix, label: langSuffix };

            tasks.push({
                mod,
                file,
                filePath,
                fileSize,
                storagePath,
                langSuffix,
                langInfo
            });
        }
    }

    console.log(`Total tasks to process: ${tasks.length}`);

    let completed = 0;
    let skipped = 0;
    let failed = 0;
    const CONCURRENCY = 5;

    async function processTask(task) {
        const key = `${task.mod}:${task.langInfo.code}:${task.fileSize}`;
        if (existingMap.has(key)) {
            skipped++;
            console.log(`⏩ [Skipped existing] ${task.mod}/${task.file}`);
            return;
        }

        const sizeMb = (task.fileSize / (1024 * 1024)).toFixed(2);
        try {
            const fileBuffer = fs.readFileSync(task.filePath);
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(task.storagePath, fileBuffer, {
                    contentType: 'video/mp4',
                    upsert: true
                });

            if (uploadError) {
                console.error(`❌ [${task.mod}] ${task.file} Upload Failed:`, uploadError.message);
                failed++;
                return;
            }

            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(task.storagePath);

            const publicUrl = urlData.publicUrl;

            await pgClient.query(`
                INSERT INTO tutorial_videos (module_key, language_code, language_label, filename, storage_path, public_url, file_size_bytes, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                ON CONFLICT (module_key, language_code) 
                DO UPDATE SET 
                    filename = EXCLUDED.filename,
                    storage_path = EXCLUDED.storage_path,
                    public_url = EXCLUDED.public_url,
                    file_size_bytes = EXCLUDED.file_size_bytes,
                    updated_at = NOW();
            `, [task.mod, task.langInfo.code, task.langInfo.label, task.file, task.storagePath, publicUrl, task.fileSize]);

            completed++;
            console.log(`[${completed + skipped}/${tasks.length}] ✅ Synced: ${task.mod}/${task.file} (${sizeMb} MB)`);
        } catch (err) {
            console.error(`❌ [${task.mod}] ${task.file} Error:`, err.message);
            failed++;
        }
    }

    let currentIndex = 0;
    async function workerThread(workerId) {
        while (currentIndex < tasks.length) {
            const task = tasks[currentIndex++];
            await processTask(task);
        }
    }

    await Promise.all(
        Array.from({ length: CONCURRENCY }, (_, i) => workerThread(i))
    );

    console.log(`\n========================================`);
    console.log(`🎉 BATCH SYNC COMPLETED!`);
    console.log(`Newly Uploaded: ${completed}`);
    console.log(`Skipped (Already in Supabase): ${skipped}`);
    console.log(`Failed: ${failed}`);

    const summaryRes = await pgClient.query(`
        SELECT module_key, count(*) as count 
        FROM tutorial_videos 
        GROUP BY module_key 
        ORDER BY module_key;
    `);
    console.log('\n--- Final Supabase Storage & DB Status ---');
    console.table(summaryRes.rows);

    await pgClient.end();
}

uploadAllVideosFast().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
