#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createDatabasePool, testDatabaseConnection, initializeTimescaleDB } from '../config/database';

/**
 * Migration tracking table
 */
const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) NOT NULL
  );
`;

/**
 * Migration file interface
 */
interface Migration {
  version: string;
  name: string;
  filename: string;
  sql: string;
  checksum: string;
}

/**
 * Calculate SHA-256 checksum of migration content
 */
async function calculateChecksum(content: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Load migration files from migrations directory
 */
async function loadMigrations(migrationsDir: string): Promise<Migration[]> {
  const files = await fs.readdir(migrationsDir);
  const migrationFiles = files
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure consistent ordering

  const migrations: Migration[] = [];

  for (const filename of migrationFiles) {
    const filePath = path.join(migrationsDir, filename);
    const sql = await fs.readFile(filePath, 'utf-8');
    const checksum = await calculateChecksum(sql);
    
    // Extract version and name from filename (e.g., "001_initial_schema.sql")
    const match = filename.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      console.warn(`Skipping invalid migration filename: ${filename}`);
      continue;
    }
    
    const [, version, name] = match;
    
    migrations.push({
      version,
      name: name.replace(/_/g, ' '),
      filename,
      sql,
      checksum
    });
  }

  return migrations;
}

/**
 * Get applied migrations from database
 */
async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query('SELECT version FROM migrations ORDER BY version');
  return new Set(result.rows.map(row => row.version));
}

/**
 * Apply a single migration
 */
async function applyMigration(pool: Pool, migration: Migration): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Execute the migration SQL
    await client.query(migration.sql);
    
    // Record the migration as applied
    await client.query(
      'INSERT INTO migrations (version, name, checksum) VALUES ($1, $2, $3)',
      [migration.version, migration.name, migration.checksum]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Applied migration ${migration.version}: ${migration.name}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify migration checksums
 */
async function verifyMigrationChecksums(pool: Pool, migrations: Migration[]): Promise<void> {
  const result = await pool.query('SELECT version, checksum FROM migrations');
  const appliedChecksums = new Map(result.rows.map(row => [row.version, row.checksum]));

  for (const migration of migrations) {
    const appliedChecksum = appliedChecksums.get(migration.version);
    if (appliedChecksum && appliedChecksum !== migration.checksum) {
      throw new Error(
        `Migration ${migration.version} checksum mismatch! ` +
        `Expected: ${migration.checksum}, Applied: ${appliedChecksum}. ` +
        `This indicates the migration file has been modified after being applied.`
      );
    }
  }
}

/**
 * Main migration function
 */
async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...');
  
  const pool = createDatabasePool();
  
  try {
    // Test database connection
    const isConnected = await testDatabaseConnection(pool);
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('✅ Database connection established');
    
    // Initialize TimescaleDB if available
    await initializeTimescaleDB(pool);
    
    // Create migrations tracking table
    await pool.query(MIGRATIONS_TABLE);
    console.log('✅ Migrations table ready');
    
    // Load migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrations = await loadMigrations(migrationsDir);
    console.log(`📁 Found ${migrations.length} migration files`);
    
    // Verify checksums of already applied migrations
    await verifyMigrationChecksums(pool, migrations);
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(pool);
    console.log(`📋 ${appliedMigrations.size} migrations already applied`);
    
    // Apply pending migrations
    let appliedCount = 0;
    for (const migration of migrations) {
      if (!appliedMigrations.has(migration.version)) {
        await applyMigration(pool, migration);
        appliedCount++;
      } else {
        console.log(`⏭️  Skipping already applied migration ${migration.version}: ${migration.name}`);
      }
    }
    
    if (appliedCount === 0) {
      console.log('✅ No new migrations to apply - database is up to date');
    } else {
      console.log(`✅ Successfully applied ${appliedCount} new migrations`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'status':
      await showMigrationStatus();
      break;
    case 'up':
    case undefined:
      await runMigrations();
      break;
    default:
      console.log('Usage: tsx migrate.ts [status|up]');
      console.log('  status - Show migration status');
      console.log('  up     - Apply pending migrations (default)');
      process.exit(1);
  }
}

/**
 * Show migration status
 */
async function showMigrationStatus(): Promise<void> {
  console.log('📊 Migration Status');
  console.log('==================');
  
  const pool = createDatabasePool();
  
  try {
    const isConnected = await testDatabaseConnection(pool);
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Check if migrations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Migrations table does not exist - run migrations first');
      return;
    }
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrations = await loadMigrations(migrationsDir);
    const appliedMigrations = await getAppliedMigrations(pool);
    
    console.log(`Total migrations: ${migrations.length}`);
    console.log(`Applied: ${appliedMigrations.size}`);
    console.log(`Pending: ${migrations.length - appliedMigrations.size}`);
    console.log('');
    
    for (const migration of migrations) {
      const status = appliedMigrations.has(migration.version) ? '✅' : '⏳';
      console.log(`${status} ${migration.version} - ${migration.name}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}
