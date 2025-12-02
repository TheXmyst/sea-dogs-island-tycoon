/**
 * Sea Dogs: Island Tycoon - Backend Server
 * Node.js + Express + PostgreSQL
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { authenticateToken, verifyOwnership, generateToken } from './middleware/auth.js';
import { createRateLimiter, getClientIP } from './middleware/rateLimiter.js';

dotenv.config();

/**
 * Get initial game state for new players
 * This matches the frontend getInitialGameState function
 */
function getInitialGameState() {
  return {
    resources: {
      gold: 1000,
      wood: 500,
      rum: 100,
      stone: 200,
      food: 50,
      crew: 20,
      cannons: 0,
      diamonds: 100,
      fragments: 0,
    },
    buildings: [
      {
        id: 'town_hall_1',
        type: 'town_hall',
        level: 1,
        x: 5, // Use position from BUILDING_POSITIONS
        y: 2, // Use position from BUILDING_POSITIONS
        completedAt: Date.now(),
        isConstructing: false,
      },
    ],
    ships: [],
    captains: [],
    crew: [],
    researchedTechnologies: [],
    technologyTimers: {},
    gachaPity: {
      pulls: 0,
      guaranteedEpicAt: 50,
      guaranteedLegendaryAt: 100,
    },
    eventProgress: {},
    timers: {
      buildings: {},
      ships: {},
    },
    version: 4,
    lastUpdate: Date.now(), // Timestamp for offline progress calculation
  };
}

const app = express();
// Railway fournit le port via PORT, sinon utiliser 5000 par défaut
const PORT = process.env.PORT || 5000;

// Middleware de sécurité
// Configuration CORS sécurisée pour Vercel (frontend) + Railway (backend)
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;

// Fonction pour valider l'origine (support Vercel avec plusieurs domaines)
const validateOrigin = (origin) => {
  // Accepter les requêtes sans origine (ex: curl, Railway healthcheck, Postman)
  // Ces requêtes sont généralement des outils de test ou des healthchecks
  if (!origin) {
    return true; // Accepter les requêtes sans origine
  }
  
  // En développement, accepter toutes les origines
  if (!isProduction) return true;
  
  // Si FRONTEND_URL n'est pas défini en production, accepter toutes les origines (avec warning)
  if (!frontendUrl) {
    console.warn('⚠️  FRONTEND_URL non défini en production. CORS ouvert à toutes les origines.');
    return true;
  }
  
  // Support de plusieurs URLs séparées par des virgules
  const allowedUrls = frontendUrl.split(',').map(url => url.trim());
  
  // Vérifier si l'origine correspond à une URL autorisée
  // Support des domaines Vercel (ex: *.vercel.app, votre-domaine.com)
  return allowedUrls.some(allowedUrl => {
    // Correspondance exacte
    if (origin === allowedUrl) return true;
    
    // Support des wildcards pour Vercel (ex: https://*.vercel.app)
    if (allowedUrl.includes('*')) {
      const regex = new RegExp('^' + allowedUrl.replace(/\*/g, '.*') + '$');
      return regex.test(origin);
    }
    
    return false;
  });
};

const corsOptions = {
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Cache preflight requests for 24 hours
};

app.use(cors(corsOptions));

// Middleware de logging pour toutes les requêtes (pour debugging)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - IP: ${req.ip || req.connection?.remoteAddress || 'unknown'}`);
  next();
});

// Limiter la taille du body JSON (protection contre DoS)
app.use(express.json({ limit: '10mb' }));

// Rate limiting global pour toutes les routes SAUF /api/health (pour Railway healthcheck)
const globalRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requêtes par minute par IP
  message: 'Trop de requêtes. Veuillez ralentir.'
});
// Exclure /api/health du rate limiting (nécessaire pour Railway healthcheck)
app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next(); // Skip rate limiting for healthcheck
  }
  return globalRateLimiter(req, res, next);
});

// Database connection with fallback to in-memory storage for development
let pool = null;
let useInMemoryDB = false;
const inMemoryDB = {
  players: new Map(),
  nextPlayerId: 1,
};

// Try to connect to PostgreSQL
// Railway provides PostgreSQL connection via DATABASE_URL (priority) or PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// Fallback to DB_* variables for local development
let pgUser, pgHost, pgDatabase, pgPassword, pgPort;

// PRIORITY 1: Check for Railway's DATABASE_URL format (postgresql://user:pass@host:port/dbname)
// This is the PRIMARY way Railway provides PostgreSQL connection
if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    pgUser = dbUrl.username;
    pgPassword = dbUrl.password;
    pgHost = dbUrl.hostname;
    pgPort = parseInt(dbUrl.port) || 5432;
    pgDatabase = dbUrl.pathname.slice(1); // Remove leading /
    console.log('📦 Using DATABASE_URL format (Railway primary method)');
  } catch (error) {
    console.warn('⚠️  Could not parse DATABASE_URL:', error.message);
  }
}

// PRIORITY 2: Use Railway's PG_* variables (if DATABASE_URL not available)
if (!pgHost) {
  pgUser = process.env.PGUSER || process.env.DB_USER;
  pgHost = process.env.PGHOST || process.env.DB_HOST;
  pgDatabase = process.env.PGDATABASE || process.env.DB_NAME;
  pgPassword = process.env.PGPASSWORD || process.env.DB_PASSWORD;
  pgPort = parseInt(process.env.PGPORT || process.env.DB_PORT) || 5432;
}

// Log PostgreSQL configuration (without password)
console.log('\n🔍 PostgreSQL Configuration Check:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`   PGHOST: ${pgHost || 'NOT SET'}`);
console.log(`   PGDATABASE: ${pgDatabase || 'NOT SET'}`);
console.log(`   PGUSER: ${pgUser || 'NOT SET'}`);
console.log(`   PGPORT: ${pgPort}`);
console.log(`   PGPASSWORD: ${pgPassword ? '***SET***' : 'NOT SET'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET (parsed)' : 'NOT SET'}`);

// Check all environment variables for debugging
console.log('\n📋 All PostgreSQL-related environment variables:');
const pgVars = Object.keys(process.env).filter(key => 
  key.includes('PG') || key.includes('DB') || key.includes('DATABASE')
);
pgVars.forEach(key => {
  const value = process.env[key];
  if (key.includes('PASSWORD') || key.includes('PASS')) {
    console.log(`   ${key}: ${value ? '***SET***' : 'NOT SET'}`);
  } else {
    console.log(`   ${key}: ${value || 'NOT SET'}`);
  }
});

if (pgHost && pgDatabase && pgUser && pgPassword) {
  try {
    // On Railway, always use SSL. In local dev, disable SSL
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.DATABASE_URL;
    const isProduction = process.env.NODE_ENV === 'production' || isRailway;
    console.log(`\n🔌 Attempting PostgreSQL connection (SSL: ${isProduction ? 'enabled' : 'disabled'}, Railway: ${isRailway ? 'yes' : 'no'})...`);
    
    // Use DATABASE_URL directly if available (Railway's preferred method)
    const poolConfig = process.env.DATABASE_URL 
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 10000,
        }
      : {
          user: pgUser,
          host: pgHost,
          database: pgDatabase,
          password: pgPassword,
          port: pgPort,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 10000,
        };
    
    pool = new Pool(poolConfig);

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle PostgreSQL client:', err.message);
      console.error('   Error code:', err.code);
      // Don't set useInMemoryDB here, let checkDatabase handle it
    });
    
    console.log('✅ PostgreSQL pool initialized (connection will be tested on first query)');
  } catch (error) {
    console.error('❌ Could not initialize PostgreSQL pool:', error.message);
    console.error('   Error details:', error);
    pool = null;
  }
} else {
  console.warn('\n⚠️  PostgreSQL environment variables not fully configured');
  console.warn('   Missing:', {
    PGHOST: !pgHost,
    PGDATABASE: !pgDatabase,
    PGUSER: !pgUser,
    PGPASSWORD: !pgPassword,
  });
  console.warn('\n💡 Railway should automatically add these variables when you add a PostgreSQL service.');
  console.warn('   If they are missing, check:');
  console.warn('   1. Service "Postgres" is added to your Railway project');
  console.warn('   2. Variables are linked to your backend service');
  console.warn('   3. Service is redeployed after adding PostgreSQL');
}

// Helper function to check database availability
// IMPORTANT: Only use in-memory if PostgreSQL is truly unavailable
// Don't switch to in-memory just because of a temporary error
async function checkDatabase() {
  // If we've already decided to use in-memory, don't check again
  if (useInMemoryDB) {
    return false; // Return false to indicate in-memory mode
  }
  
  // If pool is not initialized, we can't use PostgreSQL
  if (!pool) {
    return false;
  }
  
  try {
    const result = await pool.query('SELECT 1');
    return true; // PostgreSQL is available
  } catch (error) {
    // Log the error but DON'T automatically switch to in-memory
    // This allows retries and prevents data loss
    console.error('❌ PostgreSQL query failed:', error.message);
    console.error('   This might be temporary. Will retry on next request.');
    return false; // Return false but don't set useInMemoryDB
  }
}

// Database initialization function
async function initializeDatabase() {
  if (!pool) {
    console.error('\n❌ PostgreSQL pool not initialized');
    console.error('❌ Missing PostgreSQL configuration!');
    console.error('   Required environment variables:');
    console.error('   - PGHOST or DB_HOST or DATABASE_URL');
    console.error('   - PGDATABASE or DB_NAME or DATABASE_URL');
    console.error('   - PGUSER or DB_USER or DATABASE_URL');
    console.error('   - PGPASSWORD or DB_PASSWORD or DATABASE_URL');
    console.error('');
    console.error('⚠️  FALLING BACK TO IN-MEMORY DATABASE');
    console.error('⚠️  ALL DATA WILL BE LOST ON RESTART/REDEPLOY!');
    console.error('');
    console.error('To fix on Railway:');
    console.error('   1. Go to Railway dashboard');
    console.error('   2. Click "+ New" → "Database" → "Add PostgreSQL"');
    console.error('   3. Railway will automatically add connection variables');
    console.error('   4. In your backend service, go to "Variables" tab');
    console.error('   5. Click "Add Reference" and select the Postgres service');
    console.error('   6. Redeploy this service');
    useInMemoryDB = true;
    return;
  }

  try {
    console.log('\n🧪 Testing PostgreSQL connection...');
    // Test connection with timeout
    const connectionPromise = pool.query('SELECT NOW(), version()');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    );
    
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ PostgreSQL connected successfully');
    console.log(`   Server time: ${result.rows[0].now}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

    // Run migrations
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const migrationPath = path.join(__dirname, 'migrations', 'init.sql');
    
    try {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(migrationSQL);
      console.log('✅ Database tables created/verified');
      
      // Run additional migration for existing databases
      const addColumnsPath = path.join(__dirname, 'migrations', 'add_game_state_columns.sql');
      try {
        const addColumnsSQL = fs.readFileSync(addColumnsPath, 'utf8');
        await pool.query(addColumnsSQL);
        console.log('✅ Game state columns added/verified');
      } catch (addColumnsError) {
        // Migration file might not exist, that's okay
        if (addColumnsError.code !== 'ENOENT') {
          console.log('ℹ️  Additional migration:', addColumnsError.message);
        }
      }
      
      // Run last_update migration
      const addLastUpdatePath = path.join(__dirname, 'migrations', 'add_last_update.sql');
      try {
        const addLastUpdateSQL = fs.readFileSync(addLastUpdatePath, 'utf8');
        await pool.query(addLastUpdateSQL);
        console.log('✅ last_update column added/verified');
      } catch (addLastUpdateError) {
        // Migration file might not exist, that's okay
        if (addLastUpdateError.code !== 'ENOENT') {
          console.log('ℹ️  Last update migration:', addLastUpdateError.message);
        }
      }
      
      // Run add_skins_columns migration
      const addSkinsPath = path.join(__dirname, 'migrations', 'add_skins_columns.sql');
      try {
        const addSkinsSQL = fs.readFileSync(addSkinsPath, 'utf8');
        await pool.query(addSkinsSQL);
        console.log('✅ captain_skins and active_skins columns added/verified');
      } catch (addSkinsError) {
        // Migration file might not exist, that's okay
        if (addSkinsError.code !== 'ENOENT') {
          console.log('ℹ️  Skins migration:', addSkinsError.message);
        }
      }
      
      // Run sea system migration
      const addSeaSystemPath = path.join(__dirname, 'migrations', 'add_sea_system.sql');
      try {
        const addSeaSystemSQL = fs.readFileSync(addSeaSystemPath, 'utf8');
        await pool.query(addSeaSystemSQL);
        console.log('✅ Sea system tables and columns added/verified');
      } catch (addSeaSystemError) {
        // Migration file might not exist, that's okay
        if (addSeaSystemError.code !== 'ENOENT') {
          console.log('ℹ️  Sea system migration:', addSeaSystemError.message);
        }
      }
      
      console.log('✅ Data will persist across deployments');
    } catch (migrationError) {
      // If file doesn't exist, create tables manually
      if (migrationError.code === 'ENOENT') {
        console.log('⚠️  Migration file not found, creating tables manually...');
        await createTablesManually();
      } else {
        console.warn('⚠️  Migration error:', migrationError.message);
        // Try to create tables manually anyway
        await createTablesManually();
      }
    }
  } catch (error) {
    console.error('\n❌ PostgreSQL connection error:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    console.error('');
    console.error('⚠️  FALLING BACK TO IN-MEMORY DATABASE');
    console.error('⚠️  WARNING: Data will be lost on restart/redeploy!');
    console.error('');
    console.error('Possible causes:');
    console.error('   1. PostgreSQL service not added on Railway');
    console.error('   2. Environment variables not set correctly');
    console.error('   3. Network/firewall issues');
    console.error('   4. PostgreSQL service not running');
    console.error('   5. SSL/TLS connection issues');
    console.error('   6. Wrong credentials or database name');
    console.error('');
    console.error('To fix:');
    console.error('   1. Check Railway dashboard for PostgreSQL service');
    console.error('   2. Verify environment variables are set in backend service');
    console.error('   3. Check Railway logs for PostgreSQL connection errors');
    console.error('   4. Try adding variables manually or using "Add Reference"');
    useInMemoryDB = true;
  }
}

// Create tables manually if migration file doesn't exist
async function createTablesManually() {
  const createTablesSQL = `
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
  `;

  try {
    await pool.query(createTablesSQL);
    console.log('✅ Database tables created successfully');
  } catch (error) {
    // Ignore "already exists" errors
    if (error.code !== '42P07') {
      console.warn('⚠️  Error creating tables:', error.message);
    } else {
      console.log('✅ Database tables already exist');
    }
  }
}

// Initialize database on startup
// Database will be initialized before server starts (see app.listen below)

// Routes

// Route de test ultra-simple (AVANT tout middleware)
app.get('/', (req, res) => {
  console.log('📥 Root request received');
  res.status(200).send('Server is running!');
});

// Health check SIMPLE et IMMÉDIAT pour Railway (doit répondre instantanément)
// Cette route doit être définie AVANT tout autre middleware complexe
app.get('/api/health', (req, res) => {
  // Réponse immédiate sans async/await pour éviter tout délai
  console.log('🏥 Healthcheck request received:', {
    method: req.method,
    path: req.path,
    url: req.url,
    origin: req.headers.origin || 'none',
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection?.remoteAddress
  });
  
  try {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
    console.log('✅ Healthcheck response sent');
  } catch (error) {
    console.error('❌ Error sending healthcheck response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check DÉTAILLÉ avec statut de la base de données (pour debugging)
app.get('/api/health/detailed', async (req, res) => {
  console.log('🏥 Detailed healthcheck request received');
  let dbConnected = false;
  let dbType = 'not-configured';
  let dbError = null;
  let connectionTest = null;
  
  // Get actual values (not from env, but from the variables we parsed)
  const pgUser = process.env.PGUSER || process.env.DB_USER;
  const pgHost = process.env.PGHOST || process.env.DB_HOST;
  const pgDatabase = process.env.PGDATABASE || process.env.DB_NAME;
  const pgPassword = process.env.PGPASSWORD || process.env.DB_PASSWORD;
  const pgPort = process.env.PGPORT || process.env.DB_PORT;
  
  if (useInMemoryDB) {
    dbType = 'in-memory';
    dbConnected = true; // In-memory is always "connected"
    connectionTest = 'Using in-memory database (data will be lost on restart)';
  } else if (pool) {
    dbType = 'postgresql';
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        pool.query('SELECT NOW(), version()'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5s')), 5000))
      ]);
      const duration = Date.now() - startTime;
      dbConnected = true;
      connectionTest = {
        success: true,
        duration: `${duration}ms`,
        serverTime: result.rows[0].now,
        version: result.rows[0].version.split(' ').slice(0, 2).join(' ')
      };
    } catch (error) {
      dbConnected = false;
      dbError = {
        message: error.message,
        code: error.code,
        name: error.name
      };
      connectionTest = {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  } else {
    dbType = 'not-configured';
    connectionTest = 'PostgreSQL pool not initialized';
  }
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: {
      type: dbType,
      connected: dbConnected,
      usingInMemory: useInMemoryDB,
      poolInitialized: !!pool,
      connectionTest: connectionTest,
      error: dbError,
      config: {
        host: pgHost || 'NOT SET',
        database: pgDatabase || 'NOT SET',
        user: pgUser || 'NOT SET',
        port: pgPort || 'NOT SET',
        password: pgPassword ? 'SET' : 'NOT SET',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV || 'NOT SET',
        railwayEnv: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
      },
      allEnvVars: {
        PGHOST: process.env.PGHOST || 'NOT SET',
        PGDATABASE: process.env.PGDATABASE || 'NOT SET',
        PGUSER: process.env.PGUSER || 'NOT SET',
        PGPORT: process.env.PGPORT || 'NOT SET',
        PGPASSWORD: process.env.PGPASSWORD ? 'SET' : 'NOT SET',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        DB_HOST: process.env.DB_HOST || 'NOT SET',
        DB_NAME: process.env.DB_NAME || 'NOT SET',
        DB_USER: process.env.DB_USER || 'NOT SET',
        DB_PORT: process.env.DB_PORT || 'NOT SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
      }
    },
    warning: useInMemoryDB ? '⚠️ Data will be lost on restart. PostgreSQL not configured.' : null,
    recommendations: !dbConnected && !useInMemoryDB ? [
      'Check Railway logs for connection errors',
      'Verify PostgreSQL service is running',
      'Check that environment variables are linked to backend service',
      'Try redeploying the backend service',
      'Check Railway dashboard for PostgreSQL service status'
    ] : null,
  });
});

// Rate limiting for registration (in-memory, cleared on restart)
const registrationRateLimit = new Map(); // IP -> { attempts: number, accounts: number, resetAt: timestamp }

// Note: getClientIP est maintenant importé depuis middleware/rateLimiter.js

// Helper function to check rate limit
function checkRateLimit(ip, maxAttempts = 10, maxAccounts = 3, windowMs = 3600000) { // 1 hour
  const now = Date.now();
  const record = registrationRateLimit.get(ip);
  
  if (!record || record.resetAt < now) {
    // Reset or create new record
    registrationRateLimit.set(ip, {
      attempts: 1,
      accounts: 0,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  if (record.attempts >= maxAttempts) {
    const waitTime = Math.ceil((record.resetAt - now) / 1000 / 60); // minutes
    return { 
      allowed: false, 
      error: `Trop de tentatives. Réessayez dans ${waitTime} minute(s).`,
      waitTime 
    };
  }
  
  if (record.accounts >= maxAccounts) {
    const waitTime = Math.ceil((record.resetAt - now) / 1000 / 60); // minutes
    return { 
      allowed: false, 
      error: `Limite de ${maxAccounts} comptes par heure atteinte. Réessayez dans ${waitTime} minute(s).`,
      waitTime 
    };
  }
  
  record.attempts++;
  return { allowed: true, remaining: maxAttempts - record.attempts };
}

// Helper function to increment account count
function incrementAccountCount(ip) {
  const record = registrationRateLimit.get(ip);
  if (record) {
    record.accounts++;
  }
}

// Cleanup old rate limit records (run every hour)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of registrationRateLimit.entries()) {
    if (record.resetAt < now) {
      registrationRateLimit.delete(ip);
    }
  }
}, 3600000); // Every hour

// Player routes
app.post('/api/players/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const clientIP = getClientIP(req);
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: rateLimitCheck.error || 'Trop de tentatives. Veuillez réessayer plus tard.' 
      });
    }
    
    // Validate input - Username
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, error: 'Nom d\'utilisateur requis' });
    }
    
    // Username validation: 3-20 characters, alphanumeric + underscore/hyphen only
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères (lettres, chiffres, _ ou - uniquement)' 
      });
    }
    
    // Validate password
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Mot de passe requis' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    if (password.length > 128) {
      return res.status(400).json({ success: false, error: 'Le mot de passe est trop long (max 128 caractères)' });
    }
    
    // Validate email (now required)
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'L\'email est obligatoire' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Format d\'email invalide' });
    }
    
    if (useInMemoryDB) {
      // In-memory database fallback
      // Check if username already exists
      for (const player of inMemoryDB.players.values()) {
        if (player.username.toLowerCase() === username.toLowerCase()) {
          return res.status(400).json({ success: false, error: 'Ce nom d\'utilisateur est déjà pris' });
        }
      }
      
      // Check if email already exists (now required)
      for (const player of inMemoryDB.players.values()) {
        if (player.email && player.email.toLowerCase() === email.trim().toLowerCase()) {
          return res.status(400).json({ success: false, error: 'Cet email est déjà utilisé' });
        }
      }
      
      // Create initial game state
      const initialResources = {
        gold: 1000,
        wood: 500,
        rum: 100,
        stone: 200,
        food: 50,
        crew: 20,
        cannons: 0,
        diamonds: 100,
        fragments: 0,
      };
      
      const initialGachaPity = {
        pulls: 0,
        guaranteedEpicAt: 50,
        guaranteedLegendaryAt: 100,
      };
      
      // Get initial game state
      const initialGameState = getInitialGameState();
      
      const playerId = `mem_${inMemoryDB.nextPlayerId++}`;
      
      // Hasher le mot de passe avec bcrypt
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      const newPlayer = {
        id: playerId,
        username,
        email: email.trim(),
        password_hash: password_hash,
        resources: initialGameState.resources,
        buildings: initialGameState.buildings,
        ships: initialGameState.ships,
        captains: initialGameState.captains,
        crew: initialGameState.crew,
        researched_technologies: initialGameState.researchedTechnologies,
        technology_timers: initialGameState.technologyTimers,
        gacha_pity: initialGameState.gachaPity,
        event_progress: initialGameState.eventProgress,
        timers: initialGameState.timers,
        game_version: initialGameState.version || 4,
        created_at: new Date().toISOString(),
      };
      
      inMemoryDB.players.set(playerId, newPlayer);
      
      // Increment account count for rate limiting
      incrementAccountCount(clientIP);
      
      // Générer un token JWT pour l'utilisateur
      const token = generateToken(newPlayer.id, newPlayer.username);
      
      res.json({ 
        success: true, 
        token: token, // Inclure le token dans la réponse
        id: newPlayer.id,
        username: newPlayer.username,
        resources: newPlayer.resources,
        buildings: newPlayer.buildings,
        ships: newPlayer.ships,
        captains: newPlayer.captains,
        crew: newPlayer.crew,
        researchedTechnologies: newPlayer.researched_technologies,
        technologyTimers: newPlayer.technology_timers,
        gachaPity: newPlayer.gacha_pity,
        eventProgress: newPlayer.event_progress,
        timers: newPlayer.timers,
        version: newPlayer.game_version,
      });
      return;
    }
    
    // PostgreSQL database
    // Hasher le mot de passe avec bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if username already exists (case-insensitive)
    const existingUsername = await pool.query(
      'SELECT id FROM players WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Ce nom d\'utilisateur est déjà pris' });
    }
    
    // Check if email already exists (now required)
    const existingEmail = await pool.query(
      'SELECT id FROM players WHERE email IS NOT NULL AND LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Cet email est déjà utilisé' });
    }
    
    // Create initial game state
    const initialResources = {
      gold: 1000,
      wood: 500,
      rum: 100,
      stone: 200,
      food: 50,
      crew: 20,
      cannons: 0,
      diamonds: 100,
      fragments: 0,
    };
    
    // Get initial game state
    const initialGameState = getInitialGameState();
    
      const result = await pool.query(
        `INSERT INTO players (username, email, password_hash, resources, gacha_pity, event_progress, 
                            buildings, ships, captains, captain_skins, active_skins, crew, researched_technologies, technology_timers, timers, game_version, last_update) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
         RETURNING id, username, created_at, resources, gacha_pity, event_progress, buildings, ships, captains, captain_skins, active_skins, crew, researched_technologies, technology_timers, timers, game_version, last_update`,
      [username, email.trim(), passwordHash, 
       JSON.stringify(initialGameState.resources), 
       JSON.stringify(initialGameState.gachaPity), 
       JSON.stringify(initialGameState.eventProgress),
       JSON.stringify(initialGameState.buildings),
       JSON.stringify(initialGameState.ships),
       JSON.stringify(initialGameState.captains),
       JSON.stringify(initialGameState.captainSkins || {}),
       JSON.stringify(initialGameState.activeSkins || {}),
       JSON.stringify(initialGameState.crew),
       JSON.stringify(initialGameState.researchedTechnologies),
       JSON.stringify(initialGameState.technologyTimers),
       JSON.stringify(initialGameState.timers),
       initialGameState.version || 4,
       Math.floor(initialGameState.lastUpdate || Date.now())]
    );
    
    const player = result.rows[0];
    
    // Increment account count for rate limiting
    incrementAccountCount(clientIP);
    
    // Assign player to a sea (if PostgreSQL available)
    if (pool && !useInMemoryDB) {
      try {
        // Check if player already has a sea
        const checkSea = await pool.query(
          'SELECT sea_id FROM players WHERE id = $1',
          [player.id]
        );
        
        if (!checkSea.rows[0]?.sea_id) {
          // Find or create sea
          let seaResult = await pool.query(
            `SELECT id FROM seas
             WHERE is_active = TRUE AND current_islands < max_islands
               AND EXISTS (SELECT 1 FROM players WHERE sea_id = seas.id)
             ORDER BY current_islands ASC LIMIT 1`
          );
          
          let seaId;
          if (seaResult.rows.length === 0) {
            const newSea = await pool.query(
              `INSERT INTO seas (name, current_islands, is_active)
               VALUES ($1, 0, TRUE) RETURNING id`,
              [`Sea ${Date.now()}`]
            );
            seaId = newSea.rows[0].id;
          } else {
            seaId = seaResult.rows[0].id;
          }
          
          const positionX = Math.floor(Math.random() * 1000);
          const positionY = Math.floor(Math.random() * 1000);
          
          await pool.query(
            `UPDATE players SET sea_id = $1, island_position_x = $2, island_position_y = $3 WHERE id = $4`,
            [seaId, positionX, positionY, player.id]
          );
          
          await pool.query(
            `UPDATE seas SET current_islands = current_islands + 1 WHERE id = $1`,
            [seaId]
          );
        }
      } catch (seaError) {
        console.warn('Failed to assign sea on registration:', seaError);
        // Continue anyway - sea assignment can happen later
      }
    }
    
    // Parse JSON fields
    const parseJSONB = (field) => {
      if (field === null || field === undefined) return null;
      if (typeof field === 'object') return field;
      try {
        return JSON.parse(field || 'null');
      } catch {
        return null;
      }
    };
    
    // Générer un token JWT pour l'utilisateur
    const token = generateToken(player.id, player.username);
    
    res.json({ 
      success: true, 
      token: token, // Inclure le token dans la réponse
      id: player.id,
      username: player.username,
      resources: parseJSONB(player.resources) || {},
      buildings: parseJSONB(player.buildings) || [],
      ships: parseJSONB(player.ships) || [],
      captains: parseJSONB(player.captains) || [],
      crew: parseJSONB(player.crew) || [],
      researchedTechnologies: parseJSONB(player.researched_technologies) || [],
      technologyTimers: parseJSONB(player.technology_timers) || {},
      gachaPity: parseJSONB(player.gacha_pity) || {},
      eventProgress: parseJSONB(player.event_progress) || {},
      timers: parseJSONB(player.timers) || { buildings: {}, ships: {} },
      version: player.game_version || 4,
      // Convert BIGINT to number (safe for timestamps)
      lastUpdate: player.last_update != null ? Number(player.last_update) : Date.now(), // Include lastUpdate for offline progress
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message || 'Registration failed' });
  }
});

app.post('/api/players/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (useInMemoryDB) {
      // In-memory database fallback
      let player = null;
      for (const p of inMemoryDB.players.values()) {
        if (p.username === username) {
          player = p;
          break;
        }
      }
      
      if (!player) {
        return res.status(401).json({ success: false, error: 'Identifiants invalides' });
      }
      
      // Vérifier le mot de passe avec bcrypt
      const isPasswordValid = await bcrypt.compare(password, player.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Identifiants invalides' });
      }
      
      // Générer un token JWT pour l'utilisateur
      const token = generateToken(player.id, player.username);
      
      res.json({ 
        success: true, 
        token: token, // Inclure le token dans la réponse
        id: player.id,
        username: player.username,
        resources: player.resources || {},
        buildings: player.buildings || [],
        ships: player.ships || [],
        captains: player.captains || [],
        crew: player.crew || [],
        researchedTechnologies: player.researched_technologies || [],
        technologyTimers: player.technology_timers || {},
        gachaPity: player.gacha_pity || {},
        eventProgress: player.event_progress || {},
        timers: player.timers || { buildings: {}, ships: {} },
        version: player.game_version || 4,
      });
      return;
    }
    
    // PostgreSQL database
    const result = await pool.query(
      `SELECT id, username, password_hash, resources, gacha_pity, event_progress, 
              buildings, ships, captains, captain_skins, active_skins, crew, researched_technologies, technology_timers, timers, game_version,
              COALESCE(last_update, EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT as last_update
       FROM players WHERE username = $1`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }
    
    const player = result.rows[0];
    
    // Vérifier le mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, player.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }
    
    // Update last login
    await pool.query(
      'UPDATE players SET last_login = NOW() WHERE id = $1',
      [player.id]
    );
    
    // Parse JSON fields
    const parseJSONB = (field) => {
      if (field === null || field === undefined) return null;
      if (typeof field === 'object') return field;
      try {
        return JSON.parse(field || 'null');
      } catch {
        return null;
      }
    };
    
    // Générer un token JWT pour l'utilisateur
    const token = generateToken(player.id, player.username);
    
    // Return player data with complete game state
    res.json({ 
      success: true, 
      token: token, // Inclure le token dans la réponse
      id: player.id,
      username: player.username,
      resources: parseJSONB(player.resources) || {},
      buildings: parseJSONB(player.buildings) || [],
      ships: parseJSONB(player.ships) || [],
      captains: parseJSONB(player.captains) || [],
      crew: parseJSONB(player.crew) || [],
      researchedTechnologies: parseJSONB(player.researched_technologies) || [],
      technologyTimers: parseJSONB(player.technology_timers) || {},
      gachaPity: parseJSONB(player.gacha_pity) || {},
      eventProgress: parseJSONB(player.event_progress) || {},
      timers: parseJSONB(player.timers) || { buildings: {}, ships: {} },
      version: player.game_version || 4,
      // Convert BIGINT to number
      lastUpdate: player.last_update != null ? Number(player.last_update) : Date.now(), // Include lastUpdate for offline progress
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message || 'Login failed' });
  }
});

// Island routes (protégée)
app.get('/api/islands/:playerId', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const islandResult = await pool.query(
      'SELECT * FROM islands WHERE player_id = $1',
      [playerId]
    );
    
    if (islandResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Island not found' });
    }
    
    const island = islandResult.rows[0];
    
    // Get resources
    const resourcesResult = await pool.query(
      'SELECT * FROM resources WHERE island_id = $1',
      [island.id]
    );
    
    // Get buildings
    const buildingsResult = await pool.query(
      'SELECT * FROM buildings WHERE island_id = $1',
      [island.id]
    );
    
    // Get ships
    const shipsResult = await pool.query(
      'SELECT * FROM ships WHERE island_id = $1',
      [island.id]
    );
    
    res.json({
      success: true,
      island: {
        ...island,
        resources: resourcesResult.rows[0] || {},
        buildings: buildingsResult.rows,
        ships: shipsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get island error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Game state save/load routes (protégées)
app.post('/api/game/save/:playerId', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { resources, buildings, ships, captains, captainSkins, activeSkins, crew, researchedTechnologies, technologyTimers, gachaPity, eventProgress, timers, version } = req.body;
    
    if (useInMemoryDB) {
      // In-memory database fallback
      const player = inMemoryDB.players.get(playerId);
      if (player) {
        player.resources = resources || player.resources;
        player.buildings = buildings || player.buildings || [];
        player.ships = ships || player.ships || [];
        player.captains = captains || player.captains || [];
        player.captain_skins = captainSkins || player.captain_skins || {};
        player.active_skins = activeSkins || player.active_skins || {};
        player.crew = crew || player.crew || [];
        player.researched_technologies = researchedTechnologies || player.researched_technologies || [];
        player.technology_timers = technologyTimers || player.technology_timers || {};
        player.gacha_pity = gachaPity || player.gacha_pity;
        player.event_progress = eventProgress || player.event_progress;
        player.timers = timers || player.timers || { buildings: {}, ships: {} };
        inMemoryDB.players.set(playerId, player);
      }
      res.json({ success: true, message: 'Game state saved successfully (in-memory)' });
      return;
    }
    
    // PostgreSQL database - save ALL game state data
    if (!pool) {
      console.error('❌ PostgreSQL pool not available for save');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }
    
    try {
      // Get lastUpdate from request body (timestamp in milliseconds)
      // Convert to integer for PostgreSQL BIGINT column
      let lastUpdate = req.body.lastUpdate || Date.now();
      
      // Ensure lastUpdate is a valid number
      if (typeof lastUpdate !== 'number' || isNaN(lastUpdate) || !isFinite(lastUpdate)) {
        console.warn('⚠️ Invalid lastUpdate value, using current time:', lastUpdate);
        lastUpdate = Date.now();
      }
      
      // Convert to integer (PostgreSQL BIGINT can store up to 2^63, JavaScript numbers are safe up to 2^53)
      const lastUpdateInt = Math.floor(Number(lastUpdate));
      
      const result = await pool.query(
        `UPDATE players SET 
          resources = $1, 
          gacha_pity = $2, 
          event_progress = $3,
          buildings = $4,
          ships = $5,
          captains = $6,
          captain_skins = $7,
          active_skins = $8,
          crew = $9,
          researched_technologies = $10,
          technology_timers = $11,
          timers = $12,
          game_version = $13,
          last_update = $14,
          last_login = NOW() 
        WHERE id = $15`,
        [
          JSON.stringify(resources || {}),
          JSON.stringify(gachaPity || {}),
          JSON.stringify(eventProgress || {}),
          JSON.stringify(buildings || []),
          JSON.stringify(ships || []),
          JSON.stringify(captains || []),
          JSON.stringify(captainSkins || {}),
          JSON.stringify(activeSkins || {}),
          JSON.stringify(crew || []),
          JSON.stringify(researchedTechnologies || []),
          JSON.stringify(technologyTimers || {}),
          JSON.stringify(timers || { buildings: {}, ships: {} }),
          version || 4,
          lastUpdateInt, // PostgreSQL will automatically cast integer to BIGINT
          playerId
        ]
      );
      
      if (result.rowCount === 0) {
        console.warn(`⚠️ No player found with id ${playerId} to update`);
        return res.status(404).json({ success: false, error: 'Player not found' });
      }
      
      console.log(`✅ Game state saved to PostgreSQL for player ${playerId} (${result.rowCount} row updated)`);
      console.log(`📤 Saved data for player ${playerId}:`, {
        buildings: Array.isArray(buildings) ? buildings.length : 0,
        ships: Array.isArray(ships) ? ships.length : 0,
        captains: Array.isArray(captains) ? captains.length : 0,
        captainsList: Array.isArray(captains) ? captains.map(c => `${c.id || 'no-id'}-${c.rarity || 'no-rarity'}`).slice(0, 5) : [],
        captainSkins: Object.keys(captainSkins || {}).length,
        activeSkins: Object.keys(activeSkins || {}).length,
        crew: Array.isArray(crew) ? crew.length : 0,
        technologies: Array.isArray(researchedTechnologies) ? researchedTechnologies.length : 0,
        buildingTimers: Object.keys(timers?.buildings || {}).length,
        shipTimers: Object.keys(timers?.ships || {}).length,
        techTimers: Object.keys(technologyTimers || {}).length,
        lastUpdate: new Date(lastUpdate).toISOString(),
      });
      res.json({ success: true, message: 'Game state saved successfully' });
    } catch (dbError) {
      console.error('❌ PostgreSQL save error:', dbError);
      // Don't fall back to in-memory - return error so user knows
      return res.status(500).json({ 
        success: false, 
        error: `Database error: ${dbError.message}. Please check Railway PostgreSQL configuration.` 
      });
    }
  } catch (error) {
    console.error('Save game state error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/game/load/:playerId', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    console.log(`📥 Loading game state for player ${playerId}`);
    
    // Import game progress calculator
    const { calculateGameProgress } = await import('./gameProgress.js');
    
    if (useInMemoryDB) {
      // In-memory database fallback
      const player = inMemoryDB.players.get(playerId);
      if (!player) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }
      
      // Calculate progress server-side (MMO: resources continue even when offline)
      const gameState = {
        resources: player.resources || {},
        buildings: player.buildings || [],
        ships: player.ships || [],
        captains: player.captains || [],
        researchedTechnologies: player.researched_technologies || [],
        technologyTimers: player.technology_timers || {},
        timers: player.timers || { buildings: {}, ships: {} },
        lastUpdate: player.last_update || Date.now(),
      };
      
      const updatedState = calculateGameProgress(gameState);
      
      // Update player data with calculated progress
      player.resources = updatedState.resources;
      player.buildings = updatedState.buildings;
      player.ships = updatedState.ships;
      player.researched_technologies = updatedState.researchedTechnologies;
      player.technology_timers = updatedState.technologyTimers;
      player.timers = updatedState.timers;
      player.last_update = updatedState.lastUpdate;
      inMemoryDB.players.set(playerId, player);
      
      res.json({
        success: true,
        resources: player.resources || {},
        buildings: player.buildings || [],
        ships: player.ships || [],
        captains: player.captains || [],
        crew: player.crew || [],
        researchedTechnologies: player.researched_technologies || [],
        technologyTimers: player.technology_timers || {},
        gachaPity: player.gacha_pity || {},
        eventProgress: player.event_progress || {},
        timers: player.timers || { buildings: {}, ships: {} },
        version: player.game_version || 4,
        // Convert BIGINT to number
        lastUpdate: player.last_update != null ? Number(player.last_update) : Date.now(),
      });
      return;
    }
    
    // PostgreSQL database - load ALL game state data
    if (!pool) {
      console.error('❌ PostgreSQL pool not available for load');
      return res.status(500).json({ success: false, error: 'Database not available' });
    }
    
    try {
      const result = await pool.query(
        `SELECT resources, gacha_pity, event_progress, buildings, ships, captains, captain_skins, active_skins, crew, 
                researched_technologies, technology_timers, timers, game_version, 
                COALESCE(last_update, EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT as last_update
         FROM players WHERE id = $1`,
        [playerId]
      );
      
      if (result.rows.length === 0) {
        console.warn(`⚠️ Player ${playerId} not found in PostgreSQL database`);
        return res.status(404).json({ success: false, error: 'Player not found' });
      }
      
      const player = result.rows[0];
      
      // Helper function to parse JSONB fields
      const parseJSONB = (field) => {
        if (field === null || field === undefined) return null;
        if (typeof field === 'object') return field;
        try {
          return JSON.parse(field || 'null');
        } catch {
          return null;
        }
      };
      
      let gameState = {
        success: true,
        resources: parseJSONB(player.resources) || {},
        buildings: parseJSONB(player.buildings) || [],
        ships: parseJSONB(player.ships) || [],
        captains: parseJSONB(player.captains) || [],
        captainSkins: parseJSONB(player.captain_skins) || {},
        activeSkins: parseJSONB(player.active_skins) || {},
        crew: parseJSONB(player.crew) || [],
        researchedTechnologies: parseJSONB(player.researched_technologies) || [],
        technologyTimers: parseJSONB(player.technology_timers) || {},
        gachaPity: parseJSONB(player.gacha_pity) || {},
        eventProgress: parseJSONB(player.event_progress) || {},
        timers: parseJSONB(player.timers) || { buildings: {}, ships: {} },
        version: player.game_version || 4,
        // Convert BIGINT to number (JavaScript number can handle up to 2^53, timestamps are safe)
        lastUpdate: player.last_update ? Number(player.last_update) : Date.now(),
      };
      
      // Calculate progress server-side (MMO: resources continue even when offline)
      gameState = calculateGameProgress(gameState);
      
      // Save updated state back to database
      await pool.query(
        `UPDATE players SET 
          resources = $1,
          buildings = $2,
          ships = $3,
          researched_technologies = $4,
          technology_timers = $5,
          timers = $6,
          last_update = $7
        WHERE id = $8`,
        [
          JSON.stringify(gameState.resources),
          JSON.stringify(gameState.buildings),
          JSON.stringify(gameState.ships),
          JSON.stringify(gameState.researchedTechnologies),
          JSON.stringify(gameState.technologyTimers),
          JSON.stringify(gameState.timers),
          Math.floor(gameState.lastUpdate),
          playerId
        ]
      );
      
      console.log(`✅ Loaded and calculated game progress from PostgreSQL for player ${playerId}:`, {
        buildings: gameState.buildings.length,
        buildingsList: gameState.buildings.map(b => `${b.type} Lv.${b.level}${b.isConstructing ? ' (constructing)' : ''}`),
        ships: gameState.ships.length,
        captains: gameState.captains.length,
        captainsList: gameState.captains.map(c => `${c.id} Lv.${c.level || 1}`),
        captainSkins: Object.keys(gameState.captainSkins || {}).length,
        activeSkins: Object.keys(gameState.activeSkins || {}).length,
        crew: gameState.crew.length,
        technologies: gameState.researchedTechnologies.length,
        resources: Object.keys(gameState.resources).length,
        buildingTimers: Object.keys(gameState.timers?.buildings || {}).length,
        shipTimers: Object.keys(gameState.timers?.ships || {}).length,
        techTimers: Object.keys(gameState.technologyTimers || {}).length,
        lastUpdate: new Date(gameState.lastUpdate).toISOString(),
      });
      
      // Log timer details for debugging
      if (Object.keys(gameState.timers?.buildings || {}).length > 0) {
        console.log('📋 Building timers loaded:', Object.entries(gameState.timers.buildings).map(([id, timer]) => ({
          id,
          endTime: timer?.endTime ? new Date(timer.endTime).toISOString() : 'MISSING',
          startTime: timer?.startTime ? new Date(timer.startTime).toISOString() : 'MISSING',
          remaining: timer?.remaining,
        })));
      }
      
      // Verify critical data is present
      if (gameState.buildings.length === 0) {
        console.warn('⚠️ WARNING: No buildings loaded!');
      }
      if (gameState.captains.length === 0 && gameState.resources.diamonds < 100) {
        console.warn('⚠️ WARNING: No captains loaded but diamonds suggest player had captains!');
      }
      
      // Log timer details for debugging
      if (Object.keys(gameState.timers?.buildings || {}).length > 0) {
        console.log('📋 Building timers loaded:', Object.entries(gameState.timers.buildings).map(([id, timer]) => ({
          id,
          endTime: timer?.endTime ? new Date(timer.endTime).toISOString() : 'MISSING',
          startTime: timer?.startTime ? new Date(timer.startTime).toISOString() : 'MISSING',
          remaining: timer?.remaining,
        })));
      }
      
      res.json(gameState);
    } catch (dbError) {
      console.error('❌ PostgreSQL load error:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: `Database error: ${dbError.message}. Please check Railway PostgreSQL configuration.` 
      });
    }
  } catch (error) {
    console.error('Load game state error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leaderboard routes
app.get('/api/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    if (useInMemoryDB) {
      // In-memory database fallback
      const players = Array.from(inMemoryDB.players.values())
        .map(p => ({
          id: p.id,
          username: p.username,
          gold: p.resources?.gold || 0,
          diamonds: p.resources?.diamonds || 0,
          created_at: p.created_at,
        }))
        .sort((a, b) => {
          if (b.gold !== a.gold) return b.gold - a.gold;
          return b.diamonds - a.diamonds;
        })
        .slice(0, limit);
      
      res.json({ success: true, players });
      return;
    }
    
    // PostgreSQL database
    const result = await pool.query(
      `SELECT id, username, 
              (resources->>'gold')::int as gold,
              (resources->>'diamonds')::int as diamonds,
              created_at
       FROM players 
       ORDER BY (resources->>'gold')::int DESC, (resources->>'diamonds')::int DESC
       LIMIT $1`,
      [limit]
    );
    
    res.json({ success: true, players: result.rows });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/leaderboard/rank/:playerId', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (useInMemoryDB) {
      // In-memory database fallback
      const player = inMemoryDB.players.get(playerId);
      if (!player) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }
      
      const playerGold = player.resources?.gold || 0;
      const rank = Array.from(inMemoryDB.players.values())
        .filter(p => (p.resources?.gold || 0) > playerGold).length + 1;
      
      res.json({ success: true, rank });
      return;
    }
    
    // PostgreSQL database
    const result = await pool.query(
      `SELECT COUNT(*) + 1 as rank
       FROM players
       WHERE (resources->>'gold')::int > (
         SELECT (resources->>'gold')::int FROM players WHERE id = $1
       )`,
      [playerId]
    );
    
    res.json({ success: true, rank: parseInt(result.rows[0].rank) });
  } catch (error) {
    console.error('Get rank error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Captains routes (protégée)
app.get('/api/captains/:playerId', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM captains WHERE player_id = $1',
      [playerId]
    );
    
    res.json({ success: true, captains: result.rows });
  } catch (error) {
    console.error('Get captains error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gacha routes (protégée)
app.post('/api/gacha/pull', authenticateToken, async (req, res) => {
  try {
    const { playerId, costType, costAmount, pullCount = 1 } = req.body;
    
    if (!playerId || !costType || costAmount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Champs requis manquants: playerId, costType, costAmount' 
      });
    }
    
    // Vérifier que l'utilisateur accède uniquement à ses propres données
    const authenticatedUserId = req.user?.id;
    const requestedPlayerId = parseInt(playerId);
    const authenticatedId = parseInt(authenticatedUserId);
    
    if (requestedPlayerId !== authenticatedId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès non autorisé. Vous ne pouvez effectuer des actions que pour votre propre compte.' 
      });
    }
    
    // Import gacha logic
    const { performGachaPull } = await import('./gacha.js');
    
    // Get player data
    let player;
    if (useInMemoryDB) {
      player = inMemoryDB.players.get(parseInt(playerId));
      if (!player) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }
    } else {
      const result = await pool.query(
        `SELECT resources, gacha_pity, captains FROM players WHERE id = $1`,
        [playerId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }
      
      player = result.rows[0];
      player.resources = typeof player.resources === 'string' ? JSON.parse(player.resources) : player.resources;
      player.gacha_pity = typeof player.gacha_pity === 'string' ? JSON.parse(player.gacha_pity) : player.gacha_pity;
      player.captains = typeof player.captains === 'string' ? JSON.parse(player.captains) : player.captains;
    }
    
    // Validate resources
    const currentResources = player.resources || {};
    const requiredAmount = costAmount * pullCount;
    
    if (costType === 'diamonds') {
      if ((currentResources.diamonds || 0) < requiredAmount) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient diamonds. Need ${requiredAmount}, have ${currentResources.diamonds || 0}` 
        });
      }
    } else if (costType === 'fragments') {
      if ((currentResources.fragments || 0) < requiredAmount) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient fragments. Need ${requiredAmount}, have ${currentResources.fragments || 0}` 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid costType. Must be "diamonds" or "fragments"' 
      });
    }
    
    // Perform gacha pull(s)
    const results = [];
    let currentPity = player.gacha_pity || { 
      pulls: 0, 
      epicPulls: 0, 
      legendaryPulls: 0, 
      guaranteedEpicAt: 50, 
      guaranteedLegendaryAt: 100 
    };
    let updatedResources = { ...currentResources };
    let updatedCaptains = Array.isArray(player.captains) ? [...player.captains] : [];
    
    for (let i = 0; i < pullCount; i++) {
      // Perform pull
      const pullResult = performGachaPull(currentPity);
      
      // Check if captain already owned
      const alreadyOwned = updatedCaptains.some(c => c.id === pullResult.captain.id);
      
      if (alreadyOwned) {
        // Duplicate: add XP bonus
        updatedCaptains = updatedCaptains.map(c => 
          c.id === pullResult.captain.id 
            ? { ...c, xp: (c.xp || 0) + 50 }
            : c
        );
      } else {
        // New captain: add to collection
        updatedCaptains.push({
          id: pullResult.captain.id,
          rarity: pullResult.captain.rarity,
          role: pullResult.captain.role,
          level: 1,
          xp: 0,
          obtainedAt: Date.now(),
        });
      }
      
      // Update pity for next pull
      currentPity = {
        ...currentPity,
        pulls: pullResult.newPityPulls,
        epicPulls: pullResult.newEpicPulls,
        legendaryPulls: pullResult.newLegendaryPulls,
      };
      
      results.push({
        captain: pullResult.captain,
        duplicate: alreadyOwned,
        pullNumber: i + 1,
      });
    }
    
    // Deduct cost
    if (costType === 'diamonds') {
      updatedResources.diamonds = (updatedResources.diamonds || 0) - requiredAmount;
    } else {
      updatedResources.fragments = (updatedResources.fragments || 0) - requiredAmount;
    }
    
    // Update database
    if (useInMemoryDB) {
      player.resources = updatedResources;
      player.gacha_pity = currentPity;
      player.captains = updatedCaptains;
      inMemoryDB.players.set(parseInt(playerId), player);
    } else {
      await pool.query(
        `UPDATE players 
         SET resources = $1, gacha_pity = $2, captains = $3 
         WHERE id = $4`,
        [
          JSON.stringify(updatedResources),
          JSON.stringify(currentPity),
          JSON.stringify(updatedCaptains),
          playerId
        ]
      );
    }
    
    // Return results
    res.json({
      success: true,
      results: pullCount === 1 ? results[0] : results,
      newPityPulls: currentPity.pulls,
      newEpicPulls: currentPity.epicPulls,
      newLegendaryPulls: currentPity.legendaryPulls,
      updatedResources,
      updatedCaptains: updatedCaptains, // Return updated captain list
    });
  } catch (error) {
    console.error('Gacha pull error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug route: Update building position in islandLayout.js
app.post('/api/debug/update-building-position', async (req, res) => {
  try {
    const { buildingType, left, top } = req.body;
    
    if (!buildingType || left === undefined || top === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: buildingType, left, top' 
      });
    }
    
    // Import fs and path
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');
    
    // Get the project root directory (go up from backend/)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..');
    const layoutFile = path.join(projectRoot, 'src', 'config', 'islandLayout.js');
    
    // Check if file exists
    try {
      await fs.access(layoutFile);
    } catch (error) {
      return res.status(404).json({ 
        success: false, 
        error: `File not found: ${layoutFile}` 
      });
    }
    
    // Read the file
    let fileContent = await fs.readFile(layoutFile, 'utf-8');
    
    // Find and replace the building position
    // Pattern: buildingType: { ... zone: { left: '...', top: '...', ... } }
    // More flexible pattern that handles multiline
    const escapedBuildingType = buildingType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const buildingPattern = new RegExp(
      `(${escapedBuildingType}:\\s*{[\\s\\S]*?zone:\\s*{[\\s\\S]*?left:\\s*')([^']+)(',[\\s\\S]*?top:\\s*')([^']+)(')`,
      's'
    );
    
    const match = fileContent.match(buildingPattern);
    if (!match) {
      return res.status(404).json({ 
        success: false, 
        error: `Building type "${buildingType}" not found in islandLayout.js` 
      });
    }
    
    // Replace the position
    fileContent = fileContent.replace(
      buildingPattern,
      `$1${left}$3${top}$5`
    );
    
    // Write the file back
    await fs.writeFile(layoutFile, fileContent, 'utf-8');
    
    console.log(`✅ Updated building position: ${buildingType} -> left=${left}, top=${top}`);
    
    res.json({ 
      success: true, 
      message: `Position updated for ${buildingType}: left=${left}, top=${top}` 
    });
  } catch (error) {
    console.error('Update building position error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sea System Routes (protégées)
// Assign player to a sea (called on registration or first login)
app.post('/api/sea/assign/:playerId', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (useInMemoryDB) {
      return res.status(500).json({ success: false, error: 'Sea system requires PostgreSQL' });
    }
    
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }
    
    // Check if player already has a sea assigned
    const checkResult = await pool.query(
      'SELECT sea_id, island_position_x, island_position_y FROM players WHERE id = $1',
      [playerId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    
    const player = checkResult.rows[0];
    
    // If already assigned, return current assignment
    if (player.sea_id) {
      return res.json({
        success: true,
        seaId: player.sea_id,
        position: {
          x: player.island_position_x,
          y: player.island_position_y,
        },
      });
    }
    
    // Find a sea with at least one player and space available
    let seaResult = await pool.query(
      `SELECT id, name, current_islands, max_islands
       FROM seas
       WHERE is_active = TRUE 
         AND current_islands < max_islands
         AND EXISTS (
             SELECT 1 FROM players 
             WHERE sea_id = seas.id 
             AND id != $1
         )
       ORDER BY current_islands ASC
       LIMIT 1`,
      [playerId]
    );
    
    let seaId;
    
    // If no suitable sea found, create a new one
    if (seaResult.rows.length === 0) {
      const newSeaResult = await pool.query(
        `INSERT INTO seas (name, current_islands, is_active)
         VALUES ($1, 0, TRUE)
         RETURNING id, name`,
        [`Sea ${Date.now()}`]
      );
      seaId = newSeaResult.rows[0].id;
    } else {
      seaId = seaResult.rows[0].id;
    }
    
    // Generate random position (0-1000 range)
    const positionX = Math.floor(Math.random() * 1000);
    const positionY = Math.floor(Math.random() * 1000);
    
    // Assign player to sea
    await pool.query(
      `UPDATE players
       SET sea_id = $1,
           island_position_x = $2,
           island_position_y = $3
       WHERE id = $4`,
      [seaId, positionX, positionY, playerId]
    );
    
    // Update sea island count
    await pool.query(
      `UPDATE seas
       SET current_islands = current_islands + 1
       WHERE id = $1`,
      [seaId]
    );
    
    res.json({
      success: true,
      seaId,
      position: { x: positionX, y: positionY },
    });
  } catch (error) {
    console.error('Assign sea error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sea map with all islands and events
app.get('/api/sea/map/:seaId', async (req, res) => {
  try {
    const { seaId } = req.params;
    
    if (useInMemoryDB) {
      return res.status(500).json({ success: false, error: 'Sea system requires PostgreSQL' });
    }
    
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database not available' });
    }
    
    // Get sea info
    const seaResult = await pool.query(
      'SELECT id, name, max_islands, current_islands FROM seas WHERE id = $1',
      [seaId]
    );
    
    if (seaResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sea not found' });
    }
    
    const sea = seaResult.rows[0];
    
    // Get all islands (players) in this sea
    const islandsResult = await pool.query(
      `SELECT id, username, island_position_x, island_position_y, 
              (SELECT COUNT(*) FROM players p2 WHERE p2.sea_id = $1) as total_players
       FROM players
       WHERE sea_id = $1
       ORDER BY username`,
      [seaId]
    );
    
    const islands = islandsResult.rows.map(row => ({
      playerId: row.id,
      username: row.username,
      position: {
        x: row.island_position_x,
        y: row.island_position_y,
      },
    }));
    
    // Get all active events in this sea
    const eventsResult = await pool.query(
      `SELECT id, event_type, name, description, position_x, position_y,
              required_level, rewards, expires_at, max_participants, current_participants
       FROM sea_events
       WHERE sea_id = $1 AND is_active = TRUE
       ORDER BY spawn_time DESC`,
      [seaId]
    );
    
    const events = eventsResult.rows.map(row => ({
      id: row.id,
      type: row.event_type,
      name: row.name,
      description: row.description,
      position: {
        x: row.position_x,
        y: row.position_y,
      },
      requiredLevel: row.required_level,
      rewards: row.rewards,
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
    }));
    
    res.json({
      success: true,
      sea: {
        id: sea.id,
        name: sea.name,
        maxIslands: sea.max_islands,
        currentIslands: sea.current_islands,
      },
      islands,
      events,
    });
  } catch (error) {
    console.error('Get sea map error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate distance between two points
app.post('/api/sea/distance', async (req, res) => {
  try {
    const { x1, y1, x2, y2 } = req.body;
    
    if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
        typeof x2 !== 'number' || typeof y2 !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid coordinates' });
    }
    
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    res.json({
      success: true,
      distance: Math.round(distance * 100) / 100, // Round to 2 decimals
    });
  } catch (error) {
    console.error('Calculate distance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server IMMEDIATELY (for Railway healthcheck)
// Railway requires binding to 0.0.0.0, not just localhost
// Start server first, then initialize database in background
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 API available at http://0.0.0.0:${PORT}/api`);
  console.log(`✅ Healthcheck endpoint ready: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Server listening on all interfaces (0.0.0.0)`);
  console.log(`🔌 Port: ${PORT} (from process.env.PORT: ${process.env.PORT || 'default'})`);
  console.log(`⏳ Initializing database in background...`);
  
  // Vérifier que le serveur écoute vraiment
  const address = server.address();
  console.log(`📡 Server address:`, address);
  
  // Initialize database in background (non-blocking)
  initializeDatabase().then(() => {
    if (useInMemoryDB) {
      console.log(`\n⚠️  ⚠️  ⚠️  WARNING: Using in-memory database ⚠️  ⚠️  ⚠️`);
      console.log(`   All data will be LOST on restart/redeploy!`);
      console.log(`   To enable persistence:`);
      console.log(`   1. Go to Railway dashboard`);
      console.log(`   2. Click "+ New" → "Database" → "Add PostgreSQL"`);
      console.log(`   3. Railway will auto-add connection variables`);
      console.log(`   4. Redeploy this service`);
      console.log(`\n`);
    } else {
      console.log(`✅ PostgreSQL connected - Data will persist`);
    }
  }).catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    console.error('Continuing with in-memory database...');
    useInMemoryDB = true;
  });
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`   Port ${PORT} is already in use`);
  }
});

// Handle uncaught errors to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

