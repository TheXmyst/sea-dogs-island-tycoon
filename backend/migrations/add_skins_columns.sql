-- Migration: Add captain_skins and active_skins columns to players table
-- Run this to add support for captain skins persistence

DO $$ 
BEGIN
    -- Add captain_skins column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='captain_skins') THEN
        ALTER TABLE players ADD COLUMN captain_skins JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add active_skins column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='active_skins') THEN
        ALTER TABLE players ADD COLUMN active_skins JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update existing players to have default values
UPDATE players 
SET 
    captain_skins = COALESCE(captain_skins, '{}'::jsonb),
    active_skins = COALESCE(active_skins, '{}'::jsonb)
WHERE captain_skins IS NULL 
   OR active_skins IS NULL;

