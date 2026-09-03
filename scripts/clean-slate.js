import pg from 'pg';

const password = 'fPBKjyKwTXI7vA9A';
const projectRef = 'pkkrxxjinpxctkoxltuy';
const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

async function cleanSlate() {
    console.log('🧹 Executing CLEAN SLATE on Supabase PostgreSQL Database...\n');

    const client = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase PostgreSQL database.');

        // Truncate tables cleanly
        await client.query('TRUNCATE TABLE module_results, assessment_sessions, users CASCADE;');
        console.log('✅ TRUNCATED `module_results`');
        console.log('✅ TRUNCATED `assessment_sessions`');
        console.log('✅ TRUNCATED `users`');

        console.log('\n🎉 CLEAN SLATE COMPLETE! Supabase database is 100% clean and ready for fresh real patient sessions.');
    } catch (err) {
        console.error('Error during clean slate:', err.message);
    } finally {
        await client.end();
    }
}

cleanSlate();
