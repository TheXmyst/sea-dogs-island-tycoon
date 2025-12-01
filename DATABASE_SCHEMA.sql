-- Sea Dogs: Island Tycoon - Database Schema
-- PostgreSQL schema ready for backend implementation

-- Players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Islands table
CREATE TABLE islands (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'My Island',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources table
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    island_id INTEGER REFERENCES islands(id) ON DELETE CASCADE,
    gold BIGINT DEFAULT 1000,
    wood INTEGER DEFAULT 500,
    rum INTEGER DEFAULT 100,
    stone INTEGER DEFAULT 200,
    food INTEGER DEFAULT 50,
    crew INTEGER DEFAULT 20,
    cannons INTEGER DEFAULT 0,
    diamonds INTEGER DEFAULT 100,
    fragments INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings table
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    island_id INTEGER REFERENCES islands(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    is_constructing BOOLEAN DEFAULT FALSE,
    construction_start TIMESTAMP,
    construction_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Ships table
CREATE TABLE ships (
    id SERIAL PRIMARY KEY,
    island_id INTEGER REFERENCES islands(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Captains table
CREATE TABLE captains (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    captain_id VARCHAR(50) NOT NULL, -- Reference to config
    rarity VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    xp_to_next INTEGER DEFAULT 100,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Captain Skins (inventory)
CREATE TABLE captain_skins (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    captain_id INTEGER REFERENCES captains(id) ON DELETE CASCADE,
    skin_id VARCHAR(50) NOT NULL,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(captain_id, skin_id)
);

-- Active Skins
CREATE TABLE active_skins (
    id SERIAL PRIMARY KEY,
    captain_id INTEGER REFERENCES captains(id) ON DELETE CASCADE,
    skin_id VARCHAR(50) NOT NULL,
    UNIQUE(captain_id)
);

-- Gacha Pity System
CREATE TABLE gacha_pity (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    pulls INTEGER DEFAULT 0,
    guaranteed_epic_at INTEGER DEFAULT 50,
    guaranteed_legendary_at INTEGER DEFAULT 100,
    last_pull_at TIMESTAMP,
    UNIQUE(player_id)
);

-- Gacha History
CREATE TABLE gacha_history (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    captain_id VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    was_duplicate BOOLEAN DEFAULT FALSE,
    cost_type VARCHAR(20) NOT NULL, -- 'diamonds' or 'fragments'
    cost_amount INTEGER NOT NULL,
    pulled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Battles table
CREATE TABLE battles (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    ship_id INTEGER REFERENCES ships(id) ON DELETE SET NULL,
    battle_type VARCHAR(20) NOT NULL, -- 'pve', 'pvp', 'raid'
    enemy_id VARCHAR(50),
    won BOOLEAN NOT NULL,
    rewards JSONB, -- { gold: 100, wood: 50, ... }
    player_hp_before INTEGER,
    player_hp_after INTEGER,
    battle_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events/Raids table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    rewards JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

-- Event Participation
CREATE TABLE event_participation (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    rewards_claimed BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, player_id)
);

-- Alliances table
CREATE TABLE alliances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    leader_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    member_count INTEGER DEFAULT 1
);

-- Alliance Members
CREATE TABLE alliance_members (
    id SERIAL PRIMARY KEY,
    alliance_id INTEGER REFERENCES alliances(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'leader', 'officer', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(alliance_id, player_id)
);

-- Leaderboard entries (can be computed or cached)
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    score_type VARCHAR(50) NOT NULL, -- 'total_power', 'island_level', 'battles_won'
    score_value BIGINT NOT NULL,
    rank INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, score_type)
);

-- Indexes for performance
CREATE INDEX idx_buildings_island ON buildings(island_id);
CREATE INDEX idx_ships_island ON ships(island_id);
CREATE INDEX idx_captains_player ON captains(player_id);
CREATE INDEX idx_battles_player ON battles(player_id);
CREATE INDEX idx_gacha_history_player ON gacha_history(player_id);
CREATE INDEX idx_leaderboard_score ON leaderboard(score_type, score_value DESC);

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_island_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE islands SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.island_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_island_on_building_change
    AFTER INSERT OR UPDATE ON buildings
    FOR EACH ROW
    EXECUTE FUNCTION update_island_timestamp();

CREATE TRIGGER update_island_on_ship_change
    AFTER INSERT OR UPDATE ON ships
    FOR EACH ROW
    EXECUTE FUNCTION update_island_timestamp();

