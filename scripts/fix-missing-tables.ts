import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function fixMissingTables() {
    const dbConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
    };

    if (!dbConfig.host || !dbConfig.database) {
        console.error('❌ Database configuration missing in .env');
        process.exit(1);
    }

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('✅ Connected to Postgres database');

        // 1. Create ENUM types if they don't exist
        console.log('📦 Ensuring ENUM types...');
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE "app_content_type_enum" AS ENUM (
                    'terms', 'privacy', 'about', 'faq', 'partners', 'jobs', 
                    'accessibility', 'community_guidelines', 'safety_tips', 'contact_us'
                );
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `);
        
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE "job_vacancies_type_enum" AS ENUM (
                    'full_time', 'part_time', 'contract', 'remote', 'internship'
                );
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `);

        // 2. Create Tables
        console.log('🏗️ Creating tables if missing...');

        // App Content Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "app_content" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "type" "app_content_type_enum" NOT NULL,
                "title" varchar NOT NULL,
                "content" text NOT NULL,
                "locale" varchar DEFAULT 'en',
                "isPublished" boolean DEFAULT true,
                "createdAt" timestamp DEFAULT now(),
                "updatedAt" timestamp DEFAULT now()
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_app_content_type_locale" ON "app_content" ("type", "locale");
        `);

        // FAQs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "faqs" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "question" varchar NOT NULL,
                "answer" text NOT NULL,
                "category" varchar DEFAULT 'general',
                "locale" varchar DEFAULT 'en',
                "order" integer DEFAULT 0,
                "isPublished" boolean DEFAULT true,
                "createdAt" timestamp DEFAULT now(),
                "updatedAt" timestamp DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS "idx_faqs_category_locale" ON "faqs" ("category", "locale");
        `);

        // Job Vacancies Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "job_vacancies" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "title" varchar NOT NULL,
                "description" text NOT NULL,
                "requirements" text,
                "benefits" text,
                "type" "job_vacancies_type_enum" DEFAULT 'full_time',
                "location" varchar,
                "department" varchar,
                "salaryRange" varchar,
                "applicationUrl" varchar,
                "applicationEmail" varchar,
                "isActive" boolean DEFAULT true,
                "locale" varchar DEFAULT 'en',
                "createdAt" timestamp DEFAULT now(),
                "updatedAt" timestamp DEFAULT now()
            );
        `);

        // Partners Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "partners" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" varchar NOT NULL,
                "description" text,
                "logoUrl" varchar,
                "websiteUrl" varchar,
                "category" varchar,
                "isActive" boolean DEFAULT true,
                "locale" varchar DEFAULT 'en',
                "createdAt" timestamp DEFAULT now(),
                "updatedAt" timestamp DEFAULT now()
            );
        `);

        console.log('✨ Database repair complete! All missing tables and enums verified.');
        
    } catch (error) {
        console.error('❌ Database fix failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

fixMissingTables();
