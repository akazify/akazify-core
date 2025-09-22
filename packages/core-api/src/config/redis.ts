import { createClient, RedisClientType } from 'redis';
import { z } from 'zod';

/**
 * Redis configuration schema
 */
export const RedisConfigSchema = z.object({
  url: z.string().default('redis://localhost:6379'),
  password: z.string().optional(),
  database: z.number().default(0),
  maxRetriesPerRequest: z.number().default(3),
  retryDelayOnFailover: z.number().default(100),
  lazyConnect: z.boolean().default(true),
});

export type RedisConfig = z.infer<typeof RedisConfigSchema>;

/**
 * Load Redis configuration from environment variables
 */
export function loadRedisConfig(): RedisConfig {
  return RedisConfigSchema.parse({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
    lazyConnect: true,
  });
}

/**
 * Create Redis client
 */
export function createRedisClient(config?: RedisConfig): RedisClientType {
  const redisConfig = config || loadRedisConfig();
  
  return createClient({
    url: redisConfig.url,
    password: redisConfig.password,
    database: redisConfig.database,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > redisConfig.maxRetriesPerRequest) {
          return new Error('Max retries exceeded');
        }
        return Math.min(retries * redisConfig.retryDelayOnFailover, 3000);
      },
    },
  });
}

/**
 * Redis key patterns for caching
 */
export const REDIS_KEYS = {
  // Authentication and sessions
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER_PERMISSIONS: (userId: string) => `user:${userId}:permissions`,
  AUTH_TOKEN: (tokenId: string) => `auth:token:${tokenId}`,
  
  // Manufacturing data cache
  SITE: (siteId: string) => `site:${siteId}`,
  WORK_CENTER: (workCenterId: string) => `workcenter:${workCenterId}`,
  EQUIPMENT: (equipmentId: string) => `equipment:${equipmentId}`,
  MANUFACTURING_ORDER: (orderId: string) => `mo:${orderId}`,
  
  // Real-time data
  EQUIPMENT_STATUS: (equipmentId: string) => `equipment:${equipmentId}:status`,
  PRODUCTION_METRICS: (workCenterId: string, date: string) => `metrics:${workCenterId}:${date}`,
  
  // API rate limiting
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  
  // Cache invalidation tags
  CACHE_TAG: (tag: string) => `cache_tag:${tag}`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 300,     // 5 minutes
  MEDIUM: 1800,   // 30 minutes  
  LONG: 3600,     // 1 hour
  DAY: 86400,     // 24 hours
  WEEK: 604800,   // 7 days
} as const;

/**
 * Redis wrapper for caching operations
 */
export class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
      return 0;
    } catch (error) {
      console.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async setWithTags(key: string, value: any, ttl: number, tags: string[]): Promise<boolean> {
    try {
      // Set the main cache entry
      await this.set(key, value, ttl);
      
      // Associate with tags for grouped invalidation
      const pipeline = this.client.multi();
      for (const tag of tags) {
        pipeline.sAdd(REDIS_KEYS.CACHE_TAG(tag), key);
        pipeline.expire(REDIS_KEYS.CACHE_TAG(tag), ttl);
      }
      await pipeline.exec();
      
      return true;
    } catch (error) {
      console.error(`Cache set with tags error for key ${key}:`, error);
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = REDIS_KEYS.CACHE_TAG(tag);
      const keys = await this.client.sMembers(tagKey);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        await this.client.del(tagKey);
        return keys.length;
      }
      
      return 0;
    } catch (error) {
      console.error(`Cache tag invalidation error for tag ${tag}:`, error);
      return 0;
    }
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(client: RedisClientType): Promise<boolean> {
  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}
