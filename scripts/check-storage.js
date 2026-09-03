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

async function checkStorage() {
    console.log("Checking Supabase Storage buckets...");
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Storage list error:", error);
    } else {
        console.log("Existing buckets:", buckets.map(b => ({ name: b.name, public: b.public })));
    }
}

checkStorage().catch(console.error);
