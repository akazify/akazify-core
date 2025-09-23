import { Pool, PoolClient } from 'pg';
import { BaseEntitySchema } from '@akazify/core-domain';
import { z } from 'zod';

/**
 * Base entity type from domain schemas
 */
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * Database query result wrapper
 */
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

/**
 * Pagination parameters
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Filter options for queries
 */
export interface FilterOptions {
  isActive?: boolean;
  [key: string]: any;
}

/**
 * Base repository class providing common CRUD operations
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected pool: Pool;
  protected tableName: string;

  constructor(pool: Pool, tableName: string) {
    this.pool = pool;
    this.tableName = tableName;
  }

  /**
   * Get database client from pool
   */
  protected async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute a query with error handling
   */
  protected async executeQuery<R = T>(
    query: string,
    params: any[] = []
  ): Promise<QueryResult<R>> {
    const client = await this.getClient();
    try {
      const result = await client.query(query, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE id = $1 AND is_active = true
    `;
    const result = await this.executeQuery<T>(query, [id]);
    // Convert result back to camelCase
    return result.rows[0] ? this.convertKeysToCamelCase(result.rows[0]) : null;
  }

  /**
   * Find all entities with pagination and filtering
   */
  async findAll(
    options: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;

    // Build WHERE clause from filters
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Always filter by is_active unless explicitly set to false
    if (filters.isActive !== false) {
      whereConditions.push(`is_active = $${paramIndex++}`);
      params.push(filters.isActive ?? true);
    }

    // Add custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'isActive' && value !== undefined) {
        whereConditions.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count query for pagination
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.executeQuery<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Main query with pagination
    const dataQuery = `
      SELECT * FROM ${this.tableName} 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await this.executeQuery<T>(dataQuery, dataParams);

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows.map(row => this.convertKeysToCamelCase(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert object keys from camelCase to snake_case
   */
  private convertKeysToSnakeCase(obj: any): any {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[this.toSnakeCase(key)] = value;
    }
    return converted;
  }

  /**
   * Convert object keys from snake_case to camelCase
   */
  private convertKeysToCamelCase(obj: any): any {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[this.toCamelCase(key)] = value;
    }
    return converted;
  }

  /**
   * Create new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<T> {
    // Convert camelCase keys to snake_case for database
    const dbData = this.convertKeysToSnakeCase(data);
    const columns = Object.keys(dbData);
    const values = Object.values(dbData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.executeQuery<T>(query, values);
    // Convert result back to camelCase
    return this.convertKeysToCamelCase(result.rows[0]);
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<T | null> {
    // Convert camelCase keys to snake_case for database
    const dbData = this.convertKeysToSnakeCase(data);
    const columns = Object.keys(dbData);
    const values = Object.values(dbData);
    
    if (columns.length === 0) {
      return this.findById(id);
    }

    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING *
    `;

    const result = await this.executeQuery<T>(query, [id, ...values]);
    // Convert result back to camelCase
    return result.rows[0] ? this.convertKeysToCamelCase(result.rows[0]) : null;
  }

  /**
   * Soft delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName} 
      SET is_active = false
      WHERE id = $1 AND is_active = true
    `;

    const result = await this.executeQuery(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Hard delete entity by ID (use with caution)
   */
  async hardDelete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM ${this.tableName} 
      WHERE id = $1 AND is_active = true 
      LIMIT 1
    `;
    const result = await this.executeQuery(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Execute raw SQL query (use with caution)
   */
  protected async executeRawQuery<R = any>(
    query: string,
    params: any[] = []
  ): Promise<QueryResult<R>> {
    return this.executeQuery<R>(query, params);
  }

  /**
   * Begin database transaction
   */
  async beginTransaction(): Promise<PoolClient> {
    const client = await this.getClient();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }
}
