import { Pool } from 'pg';
import { WorkCenter, WorkCenterSchema, Area } from '@akazify/core-domain';
import { BaseRepository, FilterOptions, PaginatedResult, PaginationOptions } from './base';

/**
 * WorkCenter-specific filter options
 */
export interface WorkCenterFilterOptions extends FilterOptions {
  areaId?: string;
  category?: 'PRODUCTION' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY' | 'MAINTENANCE';
  code?: string;
  siteId?: string; // For filtering by site through area relationship
}

/**
 * WorkCenter with area information
 */
export interface WorkCenterWithArea extends WorkCenter {
  area: {
    id: string;
    name: string;
    code: string;
    siteId: string;
  };
}

/**
 * WorkCenter capacity metrics
 */
export interface WorkCenterCapacityMetrics {
  workCenterId: string;
  workCenterCode: string;
  capacity?: number;
  utilizationPercentage: number;
  activeOperations: number;
  plannedOperations: number;
}

/**
 * WorkCenter repository for database operations
 */
export class WorkCenterRepository extends BaseRepository<WorkCenter> {
  constructor(pool: Pool) {
    super(pool, 'work_centers');
  }

  /**
   * Find work center by code within an area
   */
  async findByCode(areaId: string, code: string): Promise<WorkCenter | null> {
    const query = `
      SELECT * FROM work_centers 
      WHERE area_id = $1 AND code = $2 AND is_active = true
    `;
    const result = await this.executeQuery<WorkCenter>(query, [areaId, code]);
    return result.rows[0] || null;
  }

  /**
   * Find work centers with area information
   */
  async findWithArea(
    options: PaginationOptions = {},
    filters: WorkCenterFilterOptions = {}
  ): Promise<PaginatedResult<WorkCenterWithArea>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'wc.created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;

    // Build WHERE clause from filters
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Always filter by is_active unless explicitly set to false
    if (filters.isActive !== false) {
      whereConditions.push(`wc.is_active = $${paramIndex++}`);
      params.push(filters.isActive ?? true);
    }

    // WorkCenter-specific filters
    if (filters.areaId) {
      whereConditions.push(`wc.area_id = $${paramIndex++}`);
      params.push(filters.areaId);
    }

    if (filters.category) {
      whereConditions.push(`wc.category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters.code) {
      whereConditions.push(`wc.code ILIKE $${paramIndex++}`);
      params.push(`%${filters.code}%`);
    }

    if (filters.siteId) {
      whereConditions.push(`a.site_id = $${paramIndex++}`);
      params.push(filters.siteId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM work_centers wc
      INNER JOIN areas a ON wc.area_id = a.id
      ${whereClause}
    `;
    const countResult = await this.executeQuery<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Main query with area information
    const dataQuery = `
      SELECT 
        wc.*,
        a.id as area_id,
        a.name as area_name,
        a.code as area_code,
        a.site_id as area_site_id
      FROM work_centers wc
      INNER JOIN areas a ON wc.area_id = a.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await this.executeQuery<any>(dataQuery, dataParams);

    // Transform results to include area information
    const transformedData: WorkCenterWithArea[] = dataResult.rows.map(row => ({
      id: row.id,
      areaId: row.area_id,
      name: row.name,
      code: row.code,
      description: row.description,
      category: row.category,
      capacity: row.capacity,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      area: {
        id: row.area_id,
        name: row.area_name,
        code: row.area_code,
        siteId: row.area_site_id,
      },
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: transformedData,
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
   * Find work centers by area
   */
  async findByArea(areaId: string): Promise<WorkCenter[]> {
    const query = `
      SELECT * FROM work_centers 
      WHERE area_id = $1 AND is_active = true
      ORDER BY name ASC
    `;
    const result = await this.executeQuery<WorkCenter>(query, [areaId]);
    return result.rows;
  }

  /**
   * Find work centers by category
   */
  async findByCategory(category: string): Promise<WorkCenter[]> {
    const query = `
      SELECT * FROM work_centers 
      WHERE category = $1 AND is_active = true
      ORDER BY name ASC
    `;
    const result = await this.executeQuery<WorkCenter>(query, [category]);
    return result.rows;
  }

  /**
   * Get work center capacity metrics
   */
  async getCapacityMetrics(workCenterId?: string): Promise<WorkCenterCapacityMetrics[]> {
    let whereClause = 'WHERE wc.is_active = true';
    const params: any[] = [];
    
    if (workCenterId) {
      whereClause += ' AND wc.id = $1';
      params.push(workCenterId);
    }

    const query = `
      SELECT 
        wc.id as work_center_id,
        wc.code as work_center_code,
        wc.capacity,
        COALESCE(
          (SELECT COUNT(*) 
           FROM manufacturing_order_operations moo 
           WHERE moo.work_center_id = wc.id 
           AND moo.status = 'IN_PROGRESS'
           AND moo.is_active = true), 0
        ) as active_operations,
        COALESCE(
          (SELECT COUNT(*) 
           FROM manufacturing_order_operations moo 
           WHERE moo.work_center_id = wc.id 
           AND moo.status IN ('WAITING', 'IN_PROGRESS')
           AND moo.is_active = true), 0
        ) as planned_operations
      FROM work_centers wc
      ${whereClause}
      ORDER BY wc.name ASC
    `;

    const result = await this.executeQuery<{
      work_center_id: string;
      work_center_code: string;
      capacity: number | null;
      active_operations: string;
      planned_operations: string;
    }>(query, params);

    return result.rows.map(row => ({
      workCenterId: row.work_center_id,
      workCenterCode: row.work_center_code,
      capacity: row.capacity || undefined,
      utilizationPercentage: row.capacity 
        ? (parseInt(row.active_operations) / row.capacity) * 100 
        : 0,
      activeOperations: parseInt(row.active_operations),
      plannedOperations: parseInt(row.planned_operations),
    }));
  }

  /**
   * Get work center statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byCategory: { category: string; count: number }[];
    totalCapacity: number;
    averageCapacity: number;
  }> {
    const queries = [
      // Total and active count
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM work_centers',
      
      // Count by category
      `SELECT category, COUNT(*) as count 
       FROM work_centers 
       WHERE is_active = true 
       GROUP BY category 
       ORDER BY count DESC`,
      
      // Capacity statistics
      `SELECT 
         SUM(capacity) as total_capacity,
         AVG(capacity) as avg_capacity
       FROM work_centers 
       WHERE is_active = true AND capacity IS NOT NULL`
    ];

    const [totalResult, categoryResult, capacityResult] = await Promise.all([
      this.executeQuery<{ total: string; active: string }>(queries[0]),
      this.executeQuery<{ category: string; count: string }>(queries[1]),
      this.executeQuery<{ total_capacity: string; avg_capacity: string }>(queries[2])
    ]);

    return {
      total: parseInt(totalResult.rows[0]?.total || '0'),
      active: parseInt(totalResult.rows[0]?.active || '0'),
      byCategory: categoryResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count)
      })),
      totalCapacity: parseFloat(capacityResult.rows[0]?.total_capacity || '0'),
      averageCapacity: parseFloat(capacityResult.rows[0]?.avg_capacity || '0'),
    };
  }

  /**
   * Create work center with validation
   */
  async create(data: Omit<WorkCenter, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<WorkCenter> {
    // Validate data against schema
    const validatedData = WorkCenterSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      version: true
    }).parse(data);

    // Check if code already exists in the same area
    const existingWorkCenter = await this.findByCode(validatedData.areaId, validatedData.code);
    if (existingWorkCenter) {
      throw new Error(`Work center with code '${validatedData.code}' already exists in this area`);
    }

    // Verify area exists
    const areaExists = await this.executeQuery(
      'SELECT 1 FROM areas WHERE id = $1 AND is_active = true',
      [validatedData.areaId]
    );
    if (areaExists.rowCount === 0) {
      throw new Error(`Area with ID '${validatedData.areaId}' does not exist or is inactive`);
    }

    return super.create(validatedData);
  }

  /**
   * Update work center with validation
   */
  async update(id: string, data: Partial<Omit<WorkCenter, 'id' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<WorkCenter | null> {
    // Validate partial data against schema
    const validatedData = WorkCenterSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      version: true
    }).partial().parse(data);

    // Check if code already exists for a different work center in the same area
    if (validatedData.code && validatedData.areaId) {
      const existingWorkCenter = await this.findByCode(validatedData.areaId, validatedData.code);
      if (existingWorkCenter && existingWorkCenter.id !== id) {
        throw new Error(`Work center with code '${validatedData.code}' already exists in this area`);
      }
    }

    // Verify area exists if area is being changed
    if (validatedData.areaId) {
      const areaExists = await this.executeQuery(
        'SELECT 1 FROM areas WHERE id = $1 AND is_active = true',
        [validatedData.areaId]
      );
      if (areaExists.rowCount === 0) {
        throw new Error(`Area with ID '${validatedData.areaId}' does not exist or is inactive`);
      }
    }

    return super.update(id, validatedData);
  }

  /**
   * Check if work center can be deleted (no equipment or operations associated)
   */
  async canDelete(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    const queries = [
      'SELECT COUNT(*) as count FROM equipment WHERE work_center_id = $1 AND is_active = true',
      'SELECT COUNT(*) as count FROM manufacturing_order_operations WHERE work_center_id = $1 AND is_active = true',
      'SELECT COUNT(*) as count FROM routing_steps WHERE work_center_id = $1 AND is_active = true'
    ];

    const [equipmentResult, operationsResult, routingResult] = await Promise.all([
      this.executeQuery<{ count: string }>(queries[0], [id]),
      this.executeQuery<{ count: string }>(queries[1], [id]),
      this.executeQuery<{ count: string }>(queries[2], [id])
    ]);

    const equipmentCount = parseInt(equipmentResult.rows[0]?.count || '0');
    const operationsCount = parseInt(operationsResult.rows[0]?.count || '0');
    const routingCount = parseInt(routingResult.rows[0]?.count || '0');

    if (equipmentCount > 0) {
      return { canDelete: false, reason: `Work center has ${equipmentCount} active equipment` };
    }

    if (operationsCount > 0) {
      return { canDelete: false, reason: `Work center has ${operationsCount} active manufacturing operations` };
    }

    if (routingCount > 0) {
      return { canDelete: false, reason: `Work center is referenced in ${routingCount} routing steps` };
    }

    return { canDelete: true };
  }
}
