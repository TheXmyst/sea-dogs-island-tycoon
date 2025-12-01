-- Migration: Add game state columns to players table
-- This migration adds columns for buildings, ships, captains, crew, technologies, etc.
-- Run this if you have existing players in the database

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add buildings column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='buildings') THEN
        ALTER TABLE players ADD COLUMN buildings JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add ships column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='ships') THEN
        ALTER TABLE players ADD COLUMN ships JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add captains column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='captains') THEN
        ALTER TABLE players ADD COLUMN captains JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add crew column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='crew') THEN
        ALTER TABLE players ADD COLUMN crew JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add researched_technologies column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='researched_technologies') THEN
        ALTER TABLE players ADD COLUMN researched_technologies JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add technology_timers column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='technology_timers') THEN
        ALTER TABLE players ADD COLUMN technology_timers JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add timers column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='timers') THEN
        ALTER TABLE players ADD COLUMN timers JSONB DEFAULT '{"buildings":{},"ships":{}}'::jsonb;
    END IF;
    
    -- Add game_version column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='players' AND column_name='game_version') THEN
        ALTER TABLE players ADD COLUMN game_version INTEGER DEFAULT 4;
    END IF;
END $$;

-- Update existing players to have default values for new columns
UPDATE players 
SET 
    buildings = COALESCE(buildings, '[]'::jsonb),
    ships = COALESCE(ships, '[]'::jsonb),
    captains = COALESCE(captains, '[]'::jsonb),
    crew = COALESCE(crew, '[]'::jsonb),
    researched_technologies = COALESCE(researched_technologies, '[]'::jsonb),
    technology_timers = COALESCE(technology_timers, '{}'::jsonb),
    timers = COALESCE(timers, '{"buildings":{},"ships":{}}'::jsonb),
    game_version = COALESCE(game_version, 4)
WHERE buildings IS NULL 
   OR ships IS NULL 
   OR captains IS NULL 
   OR crew IS NULL 
   OR researched_technologies IS NULL 
   OR technology_timers IS NULL 
   OR timers IS NULL 
   OR game_version IS NULL;

