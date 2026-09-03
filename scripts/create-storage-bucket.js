import pg from 'pg';
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

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:fPBKjyKwTXI7vA9A@db.pkkrxxjinpxctkoxltuy.supabase.co:5432/postgres";

async function createBucket() {
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log("Connected to Supabase PostgreSQL!");

    // Create public bucket 'navigation-assets'
    await client.query(`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('navigation-assets', 'navigation-assets', true, 2147483648, ARRAY['video/mp4', 'image/jpeg', 'image/png'])
        ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 2147483648;
    `);

    // Create public access policy
    await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Navigation' AND tablename = 'objects'
            ) THEN
                CREATE POLICY "Public Access Navigation" ON storage.objects
                FOR SELECT USING (bucket_id = 'navigation-assets');
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Allow Upload Navigation' AND tablename = 'objects'
            ) THEN
                CREATE POLICY "Allow Upload Navigation" ON storage.objects
                FOR INSERT WITH CHECK (bucket_id = 'navigation-assets');
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Allow Update Navigation' AND tablename = 'objects'
            ) THEN
                CREATE POLICY "Allow Update Navigation" ON storage.objects
                FOR UPDATE USING (bucket_id = 'navigation-assets');
            END IF;
        END $$;
    `);

    console.log("✅ Supabase public bucket 'navigation-assets' created with 2GB limit and public policies!");
    await client.end();
}

createBucket().catch(console.error);
