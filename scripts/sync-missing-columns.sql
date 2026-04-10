-- Sync Missing Columns for User Entity
-- Run this script to add missing columns to the users table

DO $$
BEGIN
    ALTER TYPE "users_status_enum" ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'ticket';
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Chat Settings columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "readReceipts" boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "typingIndicator" boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "autoDownloadMedia" boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "receiveDMs" boolean DEFAULT true;

-- Location
ALTER TABLE users ADD COLUMN IF NOT EXISTS "locationEnabled" boolean DEFAULT false;

-- User lifecycle / admin fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isPremium" boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "premiumStartDate" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "premiumExpiryDate" timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "verification" jsonb DEFAULT '{}'::jsonb;

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
WHERE "verification" IS NULL OR "verification" = '{}'::jsonb;

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
WHERE u.id = s."userId";

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
);

-- Verify the columns exist
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
);
