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

        const enumStatements = [
            `DO $$ BEGIN
                ALTER TYPE "users_status_enum" ADD VALUE IF NOT EXISTS 'rejected';
            EXCEPTION
                WHEN undefined_object THEN NULL;
            END $$;`,
            `DO $$ BEGIN
                ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'ticket';
            EXCEPTION
                WHEN undefined_object THEN NULL;
            END $$;`,
        ];

        for (const statement of enumStatements) {
            try {
                await client.query(statement);
            } catch (err: any) {
                console.error(`Enum sync error: ${err.message}`);
            }
        }

        // Add missing columns if they don't exist
        const alterStatements = [
            // Chat Settings
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "readReceipts" boolean DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "typingIndicator" boolean DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "autoDownloadMedia" boolean DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "receiveDMs" boolean DEFAULT true`,
            // Location
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "locationEnabled" boolean DEFAULT false`,
            // User lifecycle / admin fields
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isPremium" boolean DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "premiumStartDate" timestamptz`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "premiumExpiryDate" timestamptz`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "verification" jsonb DEFAULT '{}'::jsonb`,
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

        await client.query(`
            UPDATE users
            SET "verification" = jsonb_build_object(
                'selfie',
                jsonb_build_object(
                    'status',
                    CASE
                        WHEN "selfieVerified" = true THEN 'approved'
                        WHEN "selfieUrl" IS NOT NULL THEN 'pending'
                        ELSE 'not_uploaded'
                    END,
                    'url', "selfieUrl",
                    'rejectionReason', NULL,
                    'submittedAt', NULL,
                    'reviewedAt', NULL,
                    'reviewedBy', NULL
                ),
                'marital_status',
                jsonb_build_object(
                    'status', 'not_uploaded',
                    'url', NULL,
                    'rejectionReason', NULL,
                    'submittedAt', NULL,
                    'reviewedAt', NULL,
                    'reviewedBy', NULL
                )
            )
            WHERE "verification" IS NULL OR "verification" = '{}'::jsonb
        `);

        await client.query(`
            WITH latest_active_premium AS (
                SELECT DISTINCT ON ("userId")
                    "userId",
                    "startDate",
                    "endDate"
                FROM subscriptions
                WHERE status = 'active'
                  AND plan <> 'free'
                  AND ("endDate" IS NULL OR "endDate" > NOW())
                ORDER BY "userId", "endDate" DESC NULLS LAST, "createdAt" DESC
            )
            UPDATE users AS u
            SET
                "isPremium" = CASE
                    WHEN s."startDate" IS NULL OR s."startDate" <= NOW() THEN true
                    ELSE false
                END,
                "premiumStartDate" = s."startDate",
                "premiumExpiryDate" = s."endDate"
            FROM latest_active_premium AS s
            WHERE u.id = s."userId"
        `);

        await client.query(`
            UPDATE users
            SET
                "isPremium" = false,
                "premiumStartDate" = NULL,
                "premiumExpiryDate" = NULL
            WHERE id NOT IN (
                SELECT DISTINCT "userId"
                FROM subscriptions
                WHERE status = 'active'
                  AND plan <> 'free'
                  AND ("endDate" IS NULL OR "endDate" > NOW())
            )
        `);

        // Verify columns
        const result = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN (
                'readReceipts',
                'typingIndicator',
                'autoDownloadMedia',
                'receiveDMs',
                'locationEnabled',
                'isPremium',
                'premiumStartDate',
                'premiumExpiryDate',
                'verification'
            )
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
