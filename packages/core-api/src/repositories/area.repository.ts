import { Pool } from 'pg';
import { Area, AreaSchema } from '@akazify/core-domain';
import { BaseRepository, FilterOptions, PaginatedResult, PaginationOptions } from './base';

/**
 * Area-specific filter options
 */
export interface AreaFilterOptions extends FilterOptions {
  siteId?: string;
  level?: number;
  parentAreaId?: string;
}

/**
 * Area repository for database operations
 */
export class AreaRepository extends BaseRepository<Area> {
  constructor(pool: Pool) {
    super(pool, 'areas');
  }

  /**
   * Find area by code within a specific site
   */
  async findByCodeInSite(siteId: string, code: string): Promise<Area | null> {
    const query = `
      SELECT 
        id,
        site_id as "siteId",
        name,
        code,
        description,
        parent_area_id as "parentAreaId",
        level,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM areas 
      WHERE site_id = $1 AND code = $2 AND is_active = true
    `;
    const result = await this.executeQuery<Area>(query, [siteId, code]);
    return result.rows[0] || null;
  }

  /**
   * Find all areas for a specific site
   */
  async findBySite(
    siteId: string,
    options: PaginationOptions = {},
    filters: AreaFilterOptions = {}
  ): Promise<PaginatedResult<Area>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'level, name',
      sortOrder = 'ASC' as const,
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE site_id = $1 AND is_active = true';
    const params: any[] = [siteId];
    let paramIndex = 2;

    // Add additional filters
    if (filters.level !== undefined) {
      whereClause += ` AND level = $${paramIndex++}`;
      params.push(filters.level);
    }

    if (filters.parentAreaId !== undefined) {
      if (filters.parentAreaId === null) {
        whereClause += ` AND parent_area_id IS NULL`;
      } else {
        whereClause += ` AND parent_area_id = $${paramIndex++}`;
        params.push(filters.parentAreaId);
      }
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      ${whereClause}
    `;
    const countResult = await this.executeQuery<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Main query with pagination
    const dataQuery = `
      SELECT 
        id,
        site_id as "siteId",
        name,
        code,
        description,
        parent_area_id as "parentAreaId",
        level,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM ${this.tableName} 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await this.executeQuery<Area>(dataQuery, dataParams);

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
   * Create area with site association
   */
  async createInSite(siteId: string, data: Omit<Area, 'id' | 'siteId' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Area> {
    // Convert camelCase keys to snake_case for database
    const dbData = this.convertKeysToSnakeCase({ ...data, siteId });
    const columns = Object.keys(dbData);
    const values = Object.values(dbData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING 
        id,
        site_id as "siteId",
        name,
        code,
        description,
        parent_area_id as "parentAreaId",
        level,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
    `;

    const result = await this.executeQuery<Area>(query, values);
    return result.rows[0];
  }

  /**
   * Check if area can be deleted (no work centers or child areas)
   */
  async canDelete(areaId: string): Promise<boolean> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM work_centers WHERE area_id = $1 AND is_active = true) as work_center_count,
        (SELECT COUNT(*) FROM areas WHERE parent_area_id = $1 AND is_active = true) as child_area_count
    `;
    const result = await this.executeQuery<{ work_center_count: string; child_area_count: string }>(query, [areaId]);
    const { work_center_count, child_area_count } = result.rows[0];
    
    return parseInt(work_center_count) === 0 && parseInt(child_area_count) === 0;
  }

  /**
   * Get area statistics for a site
   */
  async getSiteAreaStatistics(siteId: string): Promise<{
    total: number;
    byLevel: { level: number; count: number }[];
    workCenterCount: number;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN wc.id IS NOT NULL THEN 1 ELSE 0 END), 0) as work_center_count
      FROM areas a
      LEFT JOIN work_centers wc ON a.id = wc.area_id AND wc.is_active = true
      WHERE a.site_id = $1 AND a.is_active = true
    `;

    const levelQuery = `
      SELECT 
        level,
        COUNT(*) as count
      FROM areas 
      WHERE site_id = $1 AND is_active = true
      GROUP BY level
      ORDER BY level
    `;

    const [statsResult, levelResult] = await Promise.all([
      this.executeQuery<{ total: string; work_center_count: string }>(statsQuery, [siteId]),
      this.executeQuery<{ level: number; count: string }>(levelQuery, [siteId])
    ]);

    return {
      total: parseInt(statsResult.rows[0]?.total || '0'),
      workCenterCount: parseInt(statsResult.rows[0]?.work_center_count || '0'),
      byLevel: levelResult.rows.map(row => ({
        level: row.level,
        count: parseInt(row.count)
      }))
    };
  }
}
