-- Migration: Add last_update column to players table for offline progress tracking
ALTER TABLE players
ADD COLUMN IF NOT EXISTS last_update BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;

