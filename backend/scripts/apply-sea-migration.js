/**
 * Script to apply sea system migration
 * Run with: node backend/scripts/apply-sea-migration.js
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  // Get database connection from environment
  let pool;
  
  try {
    // Try to connect using DATABASE_URL (Railway)
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      // Fallback to individual variables
      pool = new Pool({
        user: process.env.PGUSER || process.env.DB_USER || 'postgres',
        host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
        database: process.env.PGDATABASE || process.env.DB_NAME || 'seadogs',
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
        port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
    }
    
    console.log('📦 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');
    
    // Read migration file
    const migrationPath = join(__dirname, '../migrations/add_sea_system.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Apply migration
    console.log('🚀 Applying migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const seasCheck = await pool.query('SELECT COUNT(*) FROM seas');
    console.log(`   - Seas table: ${seasCheck.rows[0].count} rows`);
    
    const playersCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      AND column_name IN ('sea_id', 'island_position_x', 'island_position_y')
    `);
    console.log(`   - Players columns added: ${playersCheck.rows.length}/3`);
    
    const eventsCheck = await pool.query('SELECT COUNT(*) FROM sea_events');
    console.log(`   - Sea events table: ${eventsCheck.rows[0].count} rows`);
    
    console.log('\n🎉 Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

applyMigration();

