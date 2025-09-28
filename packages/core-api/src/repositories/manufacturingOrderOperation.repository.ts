import { Pool } from 'pg';
import { ManufacturingOrderOperation } from '@akazify/core-domain';
import { BaseRepository, FilterOptions, PaginatedResult, PaginationOptions } from './base';

/**
 * Manufacturing Order Operation specific filter options
 */
export interface MOOperationFilterOptions extends FilterOptions {
  manufacturingOrderId?: string;
  workCenterId?: string;
  status?: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  sequence?: number;
}

/**
 * Manufacturing Order Operation repository for tracking individual work steps
 */
export class ManufacturingOrderOperationRepository extends BaseRepository<ManufacturingOrderOperation> {
  constructor(pool: Pool) {
    super(pool, 'manufacturing_order_operations');
  }

  /**
   * Find operations by Manufacturing Order ID
   */
  async findByManufacturingOrderId(manufacturingOrderId: string): Promise<ManufacturingOrderOperation[]> {
    const query = `
      SELECT 
        id,
        manufacturing_order_id as "manufacturingOrderId",
        work_center_id as "workCenterId",
        operation_id as "operationId",
        sequence,
        planned_quantity as "plannedQuantity",
        completed_quantity as "completedQuantity",
        status,
        planned_start_time as "plannedStartTime",
        actual_start_time as "actualStartTime",
        planned_end_time as "plannedEndTime",
        actual_end_time as "actualEndTime",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM manufacturing_order_operations 
      WHERE manufacturing_order_id = $1 AND is_active = true
      ORDER BY sequence ASC
    `;
    const result = await this.executeQuery<ManufacturingOrderOperation>(query, [manufacturingOrderId]);
    return result.rows;
  }

  /**
   * Find operations with work center details
   */
  async findWithWorkCenterDetails(
    options: PaginationOptions = {},
    filters: MOOperationFilterOptions = {}
  ): Promise<PaginatedResult<ManufacturingOrderOperation & { 
    workCenterName?: string; 
    workCenterCode?: string;
    manufacturingOrderNumber?: string;
  }>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'sequence',
      sortOrder = 'ASC' as const,
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE moo.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (filters.manufacturingOrderId) {
      whereClause += ` AND moo.manufacturing_order_id = $${paramIndex++}`;
      params.push(filters.manufacturingOrderId);
    }

    if (filters.workCenterId) {
      whereClause += ` AND moo.work_center_id = $${paramIndex++}`;
      params.push(filters.workCenterId);
    }

    if (filters.status) {
      whereClause += ` AND moo.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.sequence) {
      whereClause += ` AND moo.sequence = $${paramIndex++}`;
      params.push(filters.sequence);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM manufacturing_order_operations moo
      LEFT JOIN work_centers wc ON moo.work_center_id = wc.id
      LEFT JOIN manufacturing_orders mo ON moo.manufacturing_order_id = mo.id
      ${whereClause}
    `;
    const countResult = await this.executeQuery<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Main query with joins
    const dataQuery = `
      SELECT 
        moo.id,
        moo.manufacturing_order_id as "manufacturingOrderId",
        moo.work_center_id as "workCenterId",
        moo.operation_id as "operationId",
        moo.sequence,
        moo.planned_quantity as "plannedQuantity",
        moo.completed_quantity as "completedQuantity",
        moo.status,
        moo.planned_start_time as "plannedStartTime",
        moo.actual_start_time as "actualStartTime",
        moo.planned_end_time as "plannedEndTime",
        moo.actual_end_time as "actualEndTime",
        moo.is_active as "isActive",
        moo.created_at as "createdAt",
        moo.updated_at as "updatedAt",
        moo.version,
        wc.name as "workCenterName",
        wc.code as "workCenterCode",
        mo.order_number as "manufacturingOrderNumber"
      FROM manufacturing_order_operations moo
      LEFT JOIN work_centers wc ON moo.work_center_id = wc.id
      LEFT JOIN manufacturing_orders mo ON moo.manufacturing_order_id = mo.id
      ${whereClause}
      ORDER BY moo.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await this.executeQuery<ManufacturingOrderOperation & { 
      workCenterName?: string; 
      workCenterCode?: string;
      manufacturingOrderNumber?: string;
    }>(dataQuery, dataParams);

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
   * Update operation status with validation
   */
  async updateStatus(
    id: string, 
    newStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  ): Promise<ManufacturingOrderOperation | null> {
    // Get current operation
    const currentOp = await this.findById(id);
    if (!currentOp) {
      throw new Error(`Operation with ID ${id} not found`);
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'WAITING': ['IN_PROGRESS', 'BLOCKED'],
      'IN_PROGRESS': ['COMPLETED', 'BLOCKED'],
      'COMPLETED': [], // Terminal state
      'BLOCKED': ['WAITING', 'IN_PROGRESS'] // Can be unblocked
    };

    if (!validTransitions[currentOp.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentOp.status} to ${newStatus}`);
    }

    // Update timestamps based on status
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'IN_PROGRESS' && !currentOp.actualStartTime) {
      updateData.actualStartTime = new Date();
    }
    
    if (newStatus === 'COMPLETED' && !currentOp.actualEndTime) {
      updateData.actualEndTime = new Date();
      // Set completed quantity to planned if not already set
      if (currentOp.completedQuantity < currentOp.plannedQuantity) {
        updateData.completedQuantity = currentOp.plannedQuantity;
      }
    }

    return await this.update(id, updateData);
  }

  /**
   * Update operation quantity completed
   */
  async updateQuantity(id: string, completedQuantity: number): Promise<ManufacturingOrderOperation | null> {
    const currentOp = await this.findById(id);
    if (!currentOp) {
      throw new Error(`Operation with ID ${id} not found`);
    }

    if (completedQuantity < 0 || completedQuantity > currentOp.plannedQuantity) {
      throw new Error(`Completed quantity must be between 0 and ${currentOp.plannedQuantity}`);
    }

    // Auto-complete if quantity matches planned
    const updateData: any = { completedQuantity };
    if (completedQuantity === currentOp.plannedQuantity && currentOp.status === 'IN_PROGRESS') {
      updateData.status = 'COMPLETED';
      updateData.actualEndTime = new Date();
    }

    return await this.update(id, updateData);
  }

  /**
   * Get operation progress for a manufacturing order
   */
  async getOperationProgress(manufacturingOrderId: string): Promise<{
    totalOperations: number;
    completedOperations: number;
    inProgressOperations: number;
    waitingOperations: number;
    blockedOperations: number;
    overallProgress: number;
    currentOperation?: ManufacturingOrderOperation & { workCenterName?: string };
  }> {
    const operations = await this.findByManufacturingOrderId(manufacturingOrderId);
    
    const statusCounts = operations.reduce((acc, op) => {
      acc[op.status] = (acc[op.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedOperations = statusCounts['COMPLETED'] || 0;
    const totalOperations = operations.length;
    const overallProgress = totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0;

    // Find current operation (first non-completed in sequence)
    const currentOperation = operations.find(op => op.status !== 'COMPLETED');

    // Get work center name for current operation if it exists
    let currentOperationWithDetails = undefined;
    if (currentOperation) {
      const detailQuery = `
        SELECT 
          moo.*,
          wc.name as "workCenterName"
        FROM manufacturing_order_operations moo
        LEFT JOIN work_centers wc ON moo.work_center_id = wc.id
        WHERE moo.id = $1
      `;
      const result = await this.executeQuery<ManufacturingOrderOperation & { workCenterName?: string }>(
        detailQuery, 
        [currentOperation.id]
      );
      currentOperationWithDetails = result.rows[0];
    }

    return {
      totalOperations,
      completedOperations,
      inProgressOperations: statusCounts['IN_PROGRESS'] || 0,
      waitingOperations: statusCounts['WAITING'] || 0,
      blockedOperations: statusCounts['BLOCKED'] || 0,
      overallProgress: Math.round(overallProgress),
      currentOperation: currentOperationWithDetails,
    };
  }

  /**
   * Create operations for a manufacturing order based on routing
   */
  async createOperationsFromRouting(
    manufacturingOrderId: string,
    operations: {
      workCenterId: string;
      operationId: string;
      sequence: number;
      plannedQuantity: number;
      plannedStartTime?: Date;
      plannedEndTime?: Date;
    }[]
  ): Promise<ManufacturingOrderOperation[]> {
    const createdOperations: ManufacturingOrderOperation[] = [];

    for (const opData of operations) {
      const dbData = this.convertKeysToSnakeCase({
        manufacturingOrderId,
        ...opData,
        status: 'WAITING' as const,
        completedQuantity: 0,
        isActive: true,
      });

      const columns = Object.keys(dbData);
      const values = Object.values(dbData);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING 
          id,
          manufacturing_order_id as "manufacturingOrderId",
          work_center_id as "workCenterId",
          operation_id as "operationId",
          sequence,
          planned_quantity as "plannedQuantity",
          completed_quantity as "completedQuantity",
          status,
          planned_start_time as "plannedStartTime",
          actual_start_time as "actualStartTime",
          planned_end_time as "plannedEndTime",
          actual_end_time as "actualEndTime",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt",
          version
      `;

      const result = await this.executeQuery<ManufacturingOrderOperation>(query, values);
      createdOperations.push(result.rows[0]);
    }

    return createdOperations;
  }
}
