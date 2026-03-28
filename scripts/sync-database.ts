/**
 * Database Sync Script
 * Run this to add missing columns to the users table
 * Usage: npx ts-node scripts/sync-database.ts
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

async function syncDatabase() {
    if (!DATABASE_URL) {
        console.error('DATABASE_URL not set in environment');
        process.exit(1);
    }

    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log('Connected to database');

        // Add missing columns if they don't exist
        const alterStatements = [
            // Chat Settings
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "readReceipts" boolean DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "typingIndicator" boolean DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "autoDownloadMedia" boolean DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "receiveDMs" boolean DEFAULT true`,
            // Location
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "locationEnabled" boolean DEFAULT false`,
        ];

        for (const statement of alterStatements) {
            try {
                await client.query(statement);
                console.log(`✓ ${statement.split('"')[1]} column ensured`);
            } catch (err: any) {
                if (err.code === '42701') {
                    // Column already exists
                    console.log(`- ${statement.split('"')[1]} already exists`);
                } else {
                    console.error(`✗ Error: ${err.message}`);
                }
            }
        }

        // Verify columns
        const result = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('readReceipts', 'typingIndicator', 'autoDownloadMedia', 'receiveDMs', 'locationEnabled')
        `);

        console.log('\n=== Verified Columns ===');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
        });

        console.log('\n✓ Database sync complete!');
    } catch (error) {
        console.error('Database sync failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

syncDatabase();
