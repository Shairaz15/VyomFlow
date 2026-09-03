import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const password = 'fPBKjyKwTXI7vA9A';
const projectRef = 'pkkrxxjinpxctkoxltuy';

// Connection endpoints to try (Direct, IPv4 Session Pooler, Shared Pooler)
const connectionOptions = [
    {
        name: 'Direct Connection (Port 5432)',
        connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
    },
    {
        name: 'Session Pooler (Port 5432)',
        connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require`,
    },
    {
        name: 'Transaction Pooler (Port 6543)',
        connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    },
    {
        name: 'US-East Pooler (Port 6543)',
        connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    },
    {
        name: 'EU-Central Pooler (Port 6543)',
        connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    }
];

async function runMigration() {
    const sqlPath = path.resolve(__dirname, '../supabase/schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Running automated Supabase SQL schema migration...\n');

    let client = null;
    let connected = false;

    for (const opt of connectionOptions) {
        console.log(`Attempting connection via: ${opt.name}...`);
        try {
            client = new pg.Client({
                connectionString: opt.connectionString,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000,
            });
            await client.connect();
            console.log(`✅ Connected successfully via ${opt.name}!\n`);
            connected = true;
            break;
        } catch (err) {
            console.log(`   Failed: ${err.message}`);
            if (client) {
                try { await client.end(); } catch {}
            }
        }
    }

    if (!connected || !client) {
        console.error('\n❌ Could not connect directly to PostgreSQL port.');
        console.error('If your network blocks direct port 5432/6543, you can also run supabase/schema.sql via the web dashboard.');
        process.exit(1);
    }

    try {
        console.log('Executing SQL migration script...');
        await client.query(sqlContent);
        console.log('\n🎉 ALL TABLES, COVERING INDEXES, RPC PROCEDURES & VIEWS MIGRATED AUTOMATICALLY!');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await client.end();
    }
}

runMigration();
