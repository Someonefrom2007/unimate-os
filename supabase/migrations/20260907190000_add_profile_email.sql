-- Add email column to profile table
ALTER TABLE profile ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
