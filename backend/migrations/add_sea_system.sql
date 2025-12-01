-- Sea System Migration
-- Adds support for multiple seas (maps) with player islands positioned on them

-- Seas table: Each sea can contain up to 50 islands
CREATE TABLE IF NOT EXISTS seas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_islands INTEGER DEFAULT 50,
    current_islands INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add sea_id and position to players table
-- Note: We'll store island position directly on players for simplicity
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS sea_id INTEGER REFERENCES seas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS island_position_x INTEGER,
ADD COLUMN IF NOT EXISTS island_position_y INTEGER;

-- Index for faster sea queries
CREATE INDEX IF NOT EXISTS idx_players_sea_id ON players(sea_id);
CREATE INDEX IF NOT EXISTS idx_seas_active ON seas(is_active, current_islands);

-- Sea events table: PvP and PvE events positioned on the sea map
CREATE TABLE IF NOT EXISTS sea_events (
    id SERIAL PRIMARY KEY,
    sea_id INTEGER REFERENCES seas(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL, -- 'pvp', 'pve', 'treasure', 'raid'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    required_level INTEGER DEFAULT 1,
    rewards JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    spawn_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    max_participants INTEGER DEFAULT 1,
    current_participants INTEGER DEFAULT 0
);

-- Index for sea events
CREATE INDEX IF NOT EXISTS idx_sea_events_sea ON sea_events(sea_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sea_events_position ON sea_events(sea_id, position_x, position_y);

-- Player navigation: Track where players are navigating to
CREATE TABLE IF NOT EXISTS player_navigation (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- 'island', 'event', 'position'
    target_id INTEGER, -- event_id or island_id
    target_x INTEGER,
    target_y INTEGER,
    start_x INTEGER NOT NULL,
    start_y INTEGER NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    arrival_time TIMESTAMP,
    is_complete BOOLEAN DEFAULT FALSE,
    UNIQUE(player_id) -- One navigation at a time per player
);

-- Index for navigation
CREATE INDEX IF NOT EXISTS idx_navigation_player ON player_navigation(player_id, is_complete);

-- Function to assign player to a sea (finds sea with at least one player or creates new)
CREATE OR REPLACE FUNCTION assign_player_to_sea(player_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    selected_sea_id INTEGER;
BEGIN
    -- Find a sea with at least one player and space available
    SELECT id INTO selected_sea_id
    FROM seas
    WHERE is_active = TRUE 
      AND current_islands < max_islands
      AND EXISTS (
          SELECT 1 FROM players 
          WHERE sea_id = seas.id 
          AND id != player_id_param
      )
    ORDER BY current_islands ASC
    LIMIT 1;
    
    -- If no suitable sea found, create a new one
    IF selected_sea_id IS NULL THEN
        INSERT INTO seas (name, current_islands, is_active)
        VALUES ('Sea ' || (SELECT COUNT(*) + 1 FROM seas), 0, TRUE)
        RETURNING id INTO selected_sea_id;
    END IF;
    
    -- Assign player to sea and generate random position
    UPDATE players
    SET sea_id = selected_sea_id,
        island_position_x = floor(random() * 1000)::INTEGER,
        island_position_y = floor(random() * 1000)::INTEGER
    WHERE id = player_id_param;
    
    -- Update sea island count
    UPDATE seas
    SET current_islands = current_islands + 1
    WHERE id = selected_sea_id;
    
    RETURN selected_sea_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(x1 INTEGER, y1 INTEGER, x2 INTEGER, y2 INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    RETURN SQRT(POWER(x2 - x1, 2) + POWER(y2 - y1, 2));
END;
$$ LANGUAGE plpgsql;

