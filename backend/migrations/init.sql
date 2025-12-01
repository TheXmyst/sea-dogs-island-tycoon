-- Sea Dogs: Island Tycoon - Database Schema
-- PostgreSQL schema ready for backend implementation

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    resources JSONB DEFAULT '{"gold":1000,"wood":500,"rum":100,"stone":200,"food":50,"crew":20,"cannons":0,"diamonds":100,"fragments":0}'::jsonb,
    gacha_pity JSONB DEFAULT '{"pulls":0,"guaranteedEpicAt":50,"guaranteedLegendaryAt":100}'::jsonb,
    event_progress JSONB DEFAULT '{}'::jsonb,
    buildings JSONB DEFAULT '[]'::jsonb,
    ships JSONB DEFAULT '[]'::jsonb,
    captains JSONB DEFAULT '[]'::jsonb,
    crew JSONB DEFAULT '[]'::jsonb,
    researched_technologies JSONB DEFAULT '[]'::jsonb,
    technology_timers JSONB DEFAULT '{}'::jsonb,
    timers JSONB DEFAULT '{"buildings":{},"ships":{}}'::jsonb,
    game_version INTEGER DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Islands table
CREATE TABLE IF NOT EXISTS islands (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'My Island',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    island_id INTEGER REFERENCES islands(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    is_constructing BOOLEAN DEFAULT FALSE,
    construction_start TIMESTAMP,
    construction_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ships table
CREATE TABLE IF NOT EXISTS ships (
    id SERIAL PRIMARY KEY,
    island_id INTEGER REFERENCES islands(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Captains table
CREATE TABLE IF NOT EXISTS captains (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Captain skins table
CREATE TABLE IF NOT EXISTS captain_skins (
    id SERIAL PRIMARY KEY,
    captain_id INTEGER REFERENCES captains(id) ON DELETE CASCADE,
    skin_id VARCHAR(50) NOT NULL,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(captain_id, skin_id)
);

-- Battle logs table
CREATE TABLE IF NOT EXISTS battle_logs (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    battle_type VARCHAR(50) NOT NULL,
    enemy_type VARCHAR(50),
    result VARCHAR(10) NOT NULL,
    rewards JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_islands_player_id ON islands(player_id);
CREATE INDEX IF NOT EXISTS idx_buildings_island_id ON buildings(island_id);
CREATE INDEX IF NOT EXISTS idx_ships_island_id ON ships(island_id);
CREATE INDEX IF NOT EXISTS idx_captains_player_id ON captains(player_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_player_id ON battle_logs(player_id);

