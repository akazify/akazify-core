import { Pool, PoolConfig } from 'pg';
import { z } from 'zod';

/**
 * Database configuration schema
 */
export const DatabaseConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(5432),
  database: z.string().default('akazify_core'),
  username: z.string().default('akazify'),
  password: z.string(),
  ssl: z.boolean().default(false),
  maxConnections: z.number().default(20),
  idleTimeoutMillis: z.number().default(30000),
  connectionTimeoutMillis: z.number().default(2000),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

/**
 * Load database configuration from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const password = process.env.DATABASE_PASSWORD || 'akazify_dev_password';
  console.log('Debug - Database password type:', typeof password, 'value:', password);
  
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'akazify_core',
    username: process.env.DATABASE_USER || 'akazify',
    password: String(password),
    ssl: process.env.DATABASE_SSL === 'true',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000'),
  };
  
  console.log('Debug - Final config password type:', typeof config.password, 'value:', config.password);
  return DatabaseConfigSchema.parse(config);
}

/**
 * Create PostgreSQL connection pool
 */
export function createDatabasePool(config?: DatabaseConfig): Pool {
  const dbConfig = config || loadDatabaseConfig();
  
  const poolConfig: PoolConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password,
    ssl: dbConfig.ssl,
    max: dbConfig.maxConnections,
    idleTimeoutMillis: dbConfig.idleTimeoutMillis,
    connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
  };

  return new Pool(poolConfig);
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(pool: Pool): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Initialize TimescaleDB extension if not exists
 */
export async function initializeTimescaleDB(pool: Pool): Promise<void> {
  try {
    const client = await pool.connect();
    
    // Check if TimescaleDB extension is available
    const extensionCheck = await client.query(`
      SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb'
    `);
    
    if (extensionCheck.rows.length > 0) {
      // Create TimescaleDB extension if it doesn't exist
      await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb');
      console.log('TimescaleDB extension initialized successfully');
    } else {
      console.warn('TimescaleDB extension not available - time-series optimization disabled');
    }
    
    client.release();
  } catch (error) {
    console.error('Failed to initialize TimescaleDB:', error);
    // Don't throw - continue without TimescaleDB if not available
  }
}
