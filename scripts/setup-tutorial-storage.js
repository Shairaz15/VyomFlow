import pg from 'pg';

const password = 'fPBKjyKwTXI7vA9A';
const projectRef = 'pkkrxxjinpxctkoxltuy';

async function main() {
    const client = new pg.Client({
        host: 'aws-0-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        user: `postgres.${projectRef}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to PostgreSQL via ap-southeast-1 pooler!');

    // Check buckets
    const bRes = await client.query('SELECT id, name, public FROM storage.buckets;');
    console.log('Current Buckets:', bRes.rows);

    // Create or update 'tutorial-videos' bucket
    await client.query(`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('tutorial-videos', 'tutorial-videos', true, 2147483648, ARRAY['video/mp4', 'audio/mpeg'])
        ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 2147483648;
    `);
    console.log('Bucket "tutorial-videos" ensured (public = true)!');

    // Create RLS policies for tutorial-videos
    // 1. SELECT (public read)
    await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Tutorial Videos' AND tablename = 'objects'
            ) THEN
                CREATE POLICY "Public Access Tutorial Videos" ON storage.objects
                FOR SELECT USING (bucket_id = 'tutorial-videos');
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Allow Upload Tutorial Videos' AND tablename = 'objects'
            ) THEN
                CREATE POLICY "Allow Upload Tutorial Videos" ON storage.objects
                FOR INSERT WITH CHECK (bucket_id = 'tutorial-videos');
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Allow Update Tutorial Videos' AND tablename = 'objects'
            ) THEN
                CREATE POLICY "Allow Update Tutorial Videos" ON storage.objects
                FOR UPDATE USING (bucket_id = 'tutorial-videos');
            END IF;
        END $$;
    `);
    console.log('Storage policies for "tutorial-videos" applied!');

    // Verify policies
    const pRes = await client.query(`SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%Tutorial%';`);
    console.log('Verified Policies:', pRes.rows);

    await client.end();
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
