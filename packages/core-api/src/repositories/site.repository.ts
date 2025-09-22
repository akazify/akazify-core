import { Pool } from 'pg';
import { Site, SiteSchema } from '@akazify/core-domain';
import { BaseRepository, FilterOptions, PaginatedResult, PaginationOptions } from './base';

/**
 * Site-specific filter options
 */
export interface SiteFilterOptions extends FilterOptions {
  region?: string;
  timezone?: string;
  code?: string;
}

/**
 * Site repository for database operations
 */
export class SiteRepository extends BaseRepository<Site> {
  constructor(pool: Pool) {
    super(pool, 'sites');
  }

  /**
   * Find site by code
   */
  async findByCode(code: string): Promise<Site | null> {
    const query = `
      SELECT * FROM sites 
      WHERE code = $1 AND is_active = true
    `;
    const result = await this.executeQuery<Site>(query, [code]);
    return result.rows[0] || null;
  }

  /**
   * Find sites with custom filtering
   */
  async findAll(
    options: PaginationOptions = {},
    filters: SiteFilterOptions = {}
  ): Promise<PaginatedResult<Site>> {
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

    // Site-specific filters
    if (filters.region) {
      whereConditions.push(`region ILIKE $${paramIndex++}`);
      params.push(`%${filters.region}%`);
    }

    if (filters.timezone) {
      whereConditions.push(`timezone = $${paramIndex++}`);
      params.push(filters.timezone);
    }

    if (filters.code) {
      whereConditions.push(`code ILIKE $${paramIndex++}`);
      params.push(`%${filters.code}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count query for pagination
    const countQuery = `SELECT COUNT(*) as total FROM sites ${whereClause}`;
    const countResult = await this.executeQuery<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Main query with pagination
    const dataQuery = `
      SELECT * FROM sites 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await this.executeQuery<Site>(dataQuery, dataParams);

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows,
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
   * Find sites by region
   */
  async findByRegion(region: string): Promise<Site[]> {
    const query = `
      SELECT * FROM sites 
      WHERE region ILIKE $1 AND is_active = true
      ORDER BY name ASC
    `;
    const result = await this.executeQuery<Site>(query, [`%${region}%`]);
    return result.rows;
  }

  /**
   * Get site statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byRegion: { region: string; count: number }[];
    byTimezone: { timezone: string; count: number }[];
  }> {
    const queries = [
      // Total and active count
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM sites',
      
      // Count by region
      `SELECT region, COUNT(*) as count 
       FROM sites 
       WHERE is_active = true AND region IS NOT NULL 
       GROUP BY region 
       ORDER BY count DESC`,
      
      // Count by timezone
      `SELECT timezone, COUNT(*) as count 
       FROM sites 
       WHERE is_active = true 
       GROUP BY timezone 
       ORDER BY count DESC`
    ];

    const [totalResult, regionResult, timezoneResult] = await Promise.all([
      this.executeQuery<{ total: string; active: string }>(queries[0]),
      this.executeQuery<{ region: string; count: string }>(queries[1]),
      this.executeQuery<{ timezone: string; count: string }>(queries[2])
    ]);

    return {
      total: parseInt(totalResult.rows[0]?.total || '0'),
      active: parseInt(totalResult.rows[0]?.active || '0'),
      byRegion: regionResult.rows.map(row => ({
        region: row.region,
        count: parseInt(row.count)
      })),
      byTimezone: timezoneResult.rows.map(row => ({
        timezone: row.timezone,
        count: parseInt(row.count)
      }))
    };
  }

  /**
   * Create site with validation
   */
  async create(data: Omit<Site, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Site> {
    // Validate data against schema
    const validatedData = SiteSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      version: true
    }).parse(data);

    // Check if code already exists
    const existingSite = await this.findByCode(validatedData.code);
    if (existingSite) {
      throw new Error(`Site with code '${validatedData.code}' already exists`);
    }

    return super.create(validatedData);
  }

  /**
   * Update site with validation
   */
  async update(id: string, data: Partial<Omit<Site, 'id' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<Site | null> {
    // Validate partial data against schema
    const validatedData = SiteSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      version: true
    }).partial().parse(data);

    // Check if code already exists for a different site
    if (validatedData.code) {
      const existingSite = await this.findByCode(validatedData.code);
      if (existingSite && existingSite.id !== id) {
        throw new Error(`Site with code '${validatedData.code}' already exists`);
      }
    }

    return super.update(id, validatedData);
  }

  /**
   * Check if site can be deleted (no areas associated)
   */
  async canDelete(id: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM areas 
      WHERE site_id = $1 AND is_active = true
    `;
    const result = await this.executeQuery<{ count: string }>(query, [id]);
    const count = parseInt(result.rows[0]?.count || '0');
    return count === 0;
  }
}
