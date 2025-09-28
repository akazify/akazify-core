import { Pool } from 'pg';
import { ManufacturingOrder, ManufacturingOrderOperation } from '@akazify/core-domain';
import { BaseRepository, FilterOptions, PaginatedResult, PaginationOptions } from './base';

/**
 * Manufacturing Order specific filter options
 */
export interface ManufacturingOrderFilterOptions extends FilterOptions {
  status?: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  productId?: string;
  priority?: number;
  startDateFrom?: Date;
  startDateTo?: Date;
}

/**
 * Manufacturing Order repository for production execution
 */
export class ManufacturingOrderRepository extends BaseRepository<ManufacturingOrder> {
  constructor(pool: Pool) {
    super(pool, 'manufacturing_orders');
  }

  /**
   * Find MO by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<ManufacturingOrder | null> {
    const query = `
      SELECT 
        id,
        order_number as "orderNumber",
        product_id as "productId",
        quantity,
        uom,
        bom_id as "bomId",
        routing_id as "routingId",
        planned_start_date as "plannedStartDate",
        planned_end_date as "plannedEndDate",
        actual_start_date as "actualStartDate",
        actual_end_date as "actualEndDate",
        status,
        priority,
        notes,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM manufacturing_orders 
      WHERE order_number = $1 AND is_active = true
    `;
    const result = await this.executeQuery<ManufacturingOrder>(query, [orderNumber]);
    return result.rows[0] || null;
  }

  /**
   * Find manufacturing orders with advanced filtering
   */
  async findWithFilters(
    options: PaginationOptions = {},
    filters: ManufacturingOrderFilterOptions = {}
  ): Promise<PaginatedResult<ManufacturingOrder & { productName?: string }>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'planned_start_date',
      sortOrder = 'DESC' as const,
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE mo.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (filters.status) {
      whereClause += ` AND mo.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.productId) {
      whereClause += ` AND mo.product_id = $${paramIndex++}`;
      params.push(filters.productId);
    }

    if (filters.priority) {
      whereClause += ` AND mo.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters.startDateFrom) {
      whereClause += ` AND mo.planned_start_date >= $${paramIndex++}`;
      params.push(filters.startDateFrom);
    }

    if (filters.startDateTo) {
      whereClause += ` AND mo.planned_start_date <= $${paramIndex++}`;
      params.push(filters.startDateTo);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM manufacturing_orders mo
      LEFT JOIN products p ON mo.product_id = p.id
      ${whereClause}
    `;
    const countResult = await this.executeQuery<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Main query with joins
    const dataQuery = `
      SELECT 
        mo.id,
        mo.order_number as "orderNumber",
        mo.product_id as "productId",
        mo.quantity,
        mo.uom,
        mo.bom_id as "bomId",
        mo.routing_id as "routingId",
        mo.planned_start_date as "plannedStartDate",
        mo.planned_end_date as "plannedEndDate",
        mo.actual_start_date as "actualStartDate",
        mo.actual_end_date as "actualEndDate",
        mo.status,
        mo.priority,
        mo.notes,
        mo.is_active as "isActive",
        mo.created_at as "createdAt",
        mo.updated_at as "updatedAt",
        mo.version,
        p.name as "productName"
      FROM manufacturing_orders mo
      LEFT JOIN products p ON mo.product_id = p.id
      ${whereClause}
      ORDER BY mo.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await this.executeQuery<ManufacturingOrder & { productName?: string }>(dataQuery, dataParams);

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
   * Update MO status with lifecycle validation
   */
  async updateStatus(id: string, newStatus: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'): Promise<ManufacturingOrder | null> {
    // Get current MO to validate state transition
    const currentMO = await this.findById(id);
    if (!currentMO) {
      throw new Error(`Manufacturing Order with ID ${id} not found`);
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'PLANNED': ['RELEASED', 'CANCELLED'],
      'RELEASED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // Terminal state
      'CANCELLED': [] // Terminal state
    };

    if (!validTransitions[currentMO.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentMO.status} to ${newStatus}`);
    }

    // Update timestamps based on status
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'IN_PROGRESS' && !currentMO.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    
    if (newStatus === 'COMPLETED' && !currentMO.actualEndDate) {
      updateData.actualEndDate = new Date();
    }

    return await this.update(id, updateData);
  }

  /**
   * Get MO statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: { status: string; count: number }[];
    overdue: number;
    avgLeadTime: number;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN planned_end_date < NOW() AND status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 END) as overdue,
        AVG(EXTRACT(EPOCH FROM (actual_end_date - actual_start_date)) / 3600) as avg_lead_time
      FROM manufacturing_orders 
      WHERE is_active = true
    `;

    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM manufacturing_orders 
      WHERE is_active = true
      GROUP BY status
      ORDER BY status
    `;

    const [statsResult, statusResult] = await Promise.all([
      this.executeQuery<{ 
        total: string; 
        overdue: string; 
        avg_lead_time: string | null 
      }>(statsQuery, []),
      this.executeQuery<{ status: string; count: string }>(statusQuery, [])
    ]);

    return {
      total: parseInt(statsResult.rows[0]?.total || '0'),
      overdue: parseInt(statsResult.rows[0]?.overdue || '0'),
      avgLeadTime: parseFloat(statsResult.rows[0]?.avg_lead_time || '0'),
      byStatus: statusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      }))
    };
  }

  /**
   * Create MO with auto-generated order number
   */
  async createWithOrderNumber(data: Omit<ManufacturingOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ManufacturingOrder> {
    // Generate order number (simple format: MO-YYYY-NNNNNN)
    const year = new Date().getFullYear();
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM manufacturing_orders 
      WHERE order_number LIKE 'MO-${year}-%'
    `;
    const countResult = await this.executeQuery<{ count: string }>(countQuery, []);
    const nextNumber = parseInt(countResult.rows[0].count) + 1;
    const orderNumber = `MO-${year}-${nextNumber.toString().padStart(6, '0')}`;

    // Convert camelCase keys to snake_case for database
    const dbData = this.convertKeysToSnakeCase({ ...data, orderNumber });
    const columns = Object.keys(dbData);
    const values = Object.values(dbData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING 
        id,
        order_number as "orderNumber",
        product_id as "productId",
        quantity,
        uom,
        bom_id as "bomId",
        routing_id as "routingId",
        planned_start_date as "plannedStartDate",
        planned_end_date as "plannedEndDate",
        actual_start_date as "actualStartDate",
        actual_end_date as "actualEndDate",
        status,
        priority,
        notes,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
    `;

    const result = await this.executeQuery<ManufacturingOrder>(query, values);
    return result.rows[0];
  }
}
