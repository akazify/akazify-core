import { Pool } from 'pg';
import { EnhancedQualityCheck, QualityCheckStatusType, QualityCheckResultType } from '@akazify/core-domain';
import { BaseRepository, FilterOptions, PaginatedResult, PaginationOptions } from './base';

/**
 * Quality Check specific filter options
 */
export interface QualityCheckFilterOptions extends FilterOptions {
  manufacturingOrderId?: string;
  operationId?: string;
  workCenterId?: string;
  status?: QualityCheckStatusType;
  result?: QualityCheckResultType;
  inspectorId?: string;
  checkType?: string;
  isRequired?: boolean;
}

/**
 * Quality Check repository for managing quality inspections in manufacturing
 */
export class QualityCheckRepository extends BaseRepository<EnhancedQualityCheck> {
  constructor(pool: Pool) {
    super(pool, 'quality_checks');
  }

  /**
   * Find quality checks by Manufacturing Order ID
   */
  async findByManufacturingOrderId(manufacturingOrderId: string): Promise<EnhancedQualityCheck[]> {
    const query = `
      SELECT 
        id,
        check_id as "checkId",
        manufacturing_order_id as "manufacturingOrderId",
        operation_id as "operationId",
        work_center_id as "workCenterId",
        name,
        description,
        type,
        specification,
        tolerance,
        unit,
        target_value as "targetValue",
        min_value as "minValue",
        max_value as "maxValue",
        status,
        sequence,
        is_required as "isRequired",
        result,
        measured_value as "measuredValue",
        notes,
        planned_start_time as "plannedStartTime",
        actual_start_time as "actualStartTime",
        planned_end_time as "plannedEndTime",
        actual_end_time as "actualEndTime",
        inspector_id as "inspectorId",
        inspector_name as "inspectorName",
        requires_second_check as "requiresSecondCheck",
        second_check_by as "secondCheckBy",
        second_check_result as "secondCheckResult",
        non_conformance_id as "nonConformanceId",
        corrective_action as "correctiveAction",
        attachments,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM quality_checks 
      WHERE manufacturing_order_id = $1 AND is_active = true
      ORDER BY sequence ASC, created_at ASC
    `;
    const result = await this.executeQuery<EnhancedQualityCheck>(query, [manufacturingOrderId]);
    return result.rows;
  }

  /**
   * Find quality checks by Operation ID
   */
  async findByOperationId(operationId: string): Promise<EnhancedQualityCheck[]> {
    const query = `
      SELECT 
        id,
        check_id as "checkId",
        manufacturing_order_id as "manufacturingOrderId",
        operation_id as "operationId",
        work_center_id as "workCenterId",
        name,
        description,
        type,
        specification,
        tolerance,
        unit,
        target_value as "targetValue",
        min_value as "minValue",
        max_value as "maxValue",
        status,
        sequence,
        is_required as "isRequired",
        result,
        measured_value as "measuredValue",
        notes,
        planned_start_time as "plannedStartTime",
        actual_start_time as "actualStartTime",
        planned_end_time as "plannedEndTime",
        actual_end_time as "actualEndTime",
        inspector_id as "inspectorId",
        inspector_name as "inspectorName",
        requires_second_check as "requiresSecondCheck",
        second_check_by as "secondCheckBy",
        second_check_result as "secondCheckResult",
        non_conformance_id as "nonConformanceId",
        corrective_action as "correctiveAction",
        attachments,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM quality_checks 
      WHERE operation_id = $1 AND is_active = true
      ORDER BY sequence ASC, created_at ASC
    `;
    const result = await this.executeQuery<EnhancedQualityCheck>(query, [operationId]);
    return result.rows;
  }

  /**
   * Find quality checks with manufacturing order and operation details
   */
  async findWithDetails(
    options: PaginationOptions = {},
    filters: QualityCheckFilterOptions = {}
  ): Promise<PaginatedResult<EnhancedQualityCheck & { 
    manufacturingOrderNumber?: string;
    operationName?: string;
    workCenterName?: string;
  }>> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'sequence',
      sortOrder = 'ASC' as const,
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE qc.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (filters.manufacturingOrderId) {
      whereClause += ` AND qc.manufacturing_order_id = $${paramIndex++}`;
      params.push(filters.manufacturingOrderId);
    }

    if (filters.operationId) {
      whereClause += ` AND qc.operation_id = $${paramIndex++}`;
      params.push(filters.operationId);
    }

    if (filters.workCenterId) {
      whereClause += ` AND qc.work_center_id = $${paramIndex++}`;
      params.push(filters.workCenterId);
    }

    if (filters.status) {
      whereClause += ` AND qc.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.result) {
      whereClause += ` AND qc.result = $${paramIndex++}`;
      params.push(filters.result);
    }

    if (filters.inspectorId) {
      whereClause += ` AND qc.inspector_id = $${paramIndex++}`;
      params.push(filters.inspectorId);
    }

    if (filters.checkType) {
      whereClause += ` AND qc.type = $${paramIndex++}`;
      params.push(filters.checkType);
    }

    if (filters.isRequired !== undefined) {
      whereClause += ` AND qc.is_required = $${paramIndex++}`;
      params.push(filters.isRequired);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM quality_checks qc
      LEFT JOIN manufacturing_orders mo ON qc.manufacturing_order_id = mo.id
      LEFT JOIN manufacturing_order_operations moo ON qc.operation_id = moo.id
      LEFT JOIN work_centers wc ON qc.work_center_id = wc.id
      ${whereClause}
    `;
    const countResult = await this.executeQuery<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Main query with joins
    const dataQuery = `
      SELECT 
        qc.id,
        qc.check_id as "checkId",
        qc.manufacturing_order_id as "manufacturingOrderId",
        qc.operation_id as "operationId",
        qc.work_center_id as "workCenterId",
        qc.name,
        qc.description,
        qc.type,
        qc.specification,
        qc.tolerance,
        qc.unit,
        qc.target_value as "targetValue",
        qc.min_value as "minValue",
        qc.max_value as "maxValue",
        qc.status,
        qc.sequence,
        qc.is_required as "isRequired",
        qc.result,
        qc.measured_value as "measuredValue",
        qc.notes,
        qc.planned_start_time as "plannedStartTime",
        qc.actual_start_time as "actualStartTime",
        qc.planned_end_time as "plannedEndTime",
        qc.actual_end_time as "actualEndTime",
        qc.inspector_id as "inspectorId",
        qc.inspector_name as "inspectorName",
        qc.requires_second_check as "requiresSecondCheck",
        qc.second_check_by as "secondCheckBy",
        qc.second_check_result as "secondCheckResult",
        qc.non_conformance_id as "nonConformanceId",
        qc.corrective_action as "correctiveAction",
        qc.attachments,
        qc.is_active as "isActive",
        qc.created_at as "createdAt",
        qc.updated_at as "updatedAt",
        qc.version,
        mo.order_number as "manufacturingOrderNumber",
        CASE 
          WHEN moo.id IS NOT NULL THEN CONCAT('Op ', moo.operation_id)
          ELSE null
        END as "operationName",
        wc.name as "workCenterName"
      FROM quality_checks qc
      LEFT JOIN manufacturing_orders mo ON qc.manufacturing_order_id = mo.id
      LEFT JOIN manufacturing_order_operations moo ON qc.operation_id = moo.id
      LEFT JOIN work_centers wc ON qc.work_center_id = wc.id
      ${whereClause}
      ORDER BY qc.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await this.executeQuery<EnhancedQualityCheck & { 
      manufacturingOrderNumber?: string;
      operationName?: string;
      workCenterName?: string;
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
   * Update quality check status with validation
   */
  async updateStatus(
    id: string, 
    newStatus: QualityCheckStatusType,
    inspectorId?: string,
    inspectorName?: string
  ): Promise<EnhancedQualityCheck | null> {
    // Get current quality check
    const currentQC = await this.findById(id);
    if (!currentQC) {
      throw new Error(`Quality check with ID ${id} not found`);
    }

    // Validate status transition
    const validTransitions: Record<QualityCheckStatusType, QualityCheckStatusType[]> = {
      'PENDING': ['IN_PROGRESS', 'SKIPPED'],
      'IN_PROGRESS': ['PASSED', 'FAILED', 'PENDING'], // Can go back to pending
      'PASSED': ['IN_PROGRESS'], // Allow re-inspection
      'FAILED': ['IN_PROGRESS'], // Allow re-inspection
      'SKIPPED': ['IN_PROGRESS'], // Can be un-skipped
    };

    if (!validTransitions[currentQC.status].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentQC.status} to ${newStatus}`);
    }

    // Update timestamps and inspector info based on status
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'IN_PROGRESS' && !currentQC.actualStartTime) {
      updateData.actualStartTime = new Date();
    }
    
    if ((newStatus === 'PASSED' || newStatus === 'FAILED') && !currentQC.actualEndTime) {
      updateData.actualEndTime = new Date();
    }

    if (inspectorId) {
      updateData.inspectorId = inspectorId;
    }

    if (inspectorName) {
      updateData.inspectorName = inspectorName;
    }

    return await this.update(id, updateData);
  }

  /**
   * Record inspection results
   */
  async recordResults(
    id: string,
    result: QualityCheckResultType,
    measuredValue?: number,
    notes?: string,
    inspectorId?: string,
    inspectorName?: string
  ): Promise<EnhancedQualityCheck | null> {
    const currentQC = await this.findById(id);
    if (!currentQC) {
      throw new Error(`Quality check with ID ${id} not found`);
    }

    // Auto-determine status based on result
    let newStatus: QualityCheckStatusType;
    switch (result) {
      case 'PASS':
        newStatus = 'PASSED';
        break;
      case 'FAIL':
        newStatus = 'FAILED';
        break;
      case 'CONDITIONAL_PASS':
        newStatus = 'PASSED'; // Treat as passed with conditions
        break;
      case 'NOT_APPLICABLE':
        newStatus = 'SKIPPED';
        break;
      default:
        newStatus = currentQC.status;
    }

    const updateData: any = {
      result,
      status: newStatus,
      actualEndTime: new Date(),
      ...(measuredValue !== undefined && { measuredValue }),
      ...(notes && { notes }),
      ...(inspectorId && { inspectorId }),
      ...(inspectorName && { inspectorName }),
    };

    return await this.update(id, updateData);
  }

  /**
   * Get quality check summary for a manufacturing order
   */
  async getQualitySummaryByMO(manufacturingOrderId: string): Promise<{
    totalChecks: number;
    pendingChecks: number;
    inProgressChecks: number;
    passedChecks: number;
    failedChecks: number;
    skippedChecks: number;
    overallStatus: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'MIXED';
    firstPassYield: number;
    criticalFailures: number;
  }> {
    const checks = await this.findByManufacturingOrderId(manufacturingOrderId);
    
    const statusCounts = checks.reduce((acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resultCounts = checks.reduce((acc, check) => {
      if (check.result) {
        acc[check.result] = (acc[check.result] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalChecks = checks.length;
    const pendingChecks = statusCounts['PENDING'] || 0;
    const inProgressChecks = statusCounts['IN_PROGRESS'] || 0;
    const passedChecks = statusCounts['PASSED'] || 0;
    const failedChecks = statusCounts['FAILED'] || 0;
    const skippedChecks = statusCounts['SKIPPED'] || 0;

    // Calculate overall status
    let overallStatus: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'MIXED';
    if (totalChecks === 0) {
      overallStatus = 'PENDING';
    } else if (failedChecks > 0) {
      overallStatus = 'FAILED';
    } else if (inProgressChecks > 0) {
      overallStatus = 'IN_PROGRESS';
    } else if (pendingChecks > 0) {
      overallStatus = 'PENDING';
    } else if (passedChecks === totalChecks || (passedChecks + skippedChecks === totalChecks)) {
      overallStatus = 'PASSED';
    } else {
      overallStatus = 'MIXED';
    }

    // Calculate first pass yield (percentage of checks that passed on first attempt)
    const completedChecks = passedChecks + failedChecks;
    const firstPassYield = completedChecks > 0 ? Math.round((passedChecks / completedChecks) * 100) : 0;

    // Count critical failures (required checks that failed)
    const criticalFailures = checks.filter(check => 
      check.isRequired && check.result === 'FAIL'
    ).length;

    return {
      totalChecks,
      pendingChecks,
      inProgressChecks,
      passedChecks,
      failedChecks,
      skippedChecks,
      overallStatus,
      firstPassYield,
      criticalFailures,
    };
  }

  /**
   * Create quality checks from templates for an operation
   */
  async createFromTemplates(
    manufacturingOrderId: string,
    operationId: string,
    workCenterId: string,
    templateIds: string[]
  ): Promise<EnhancedQualityCheck[]> {
    // This would fetch templates and create quality checks
    // For now, creating sample quality checks
    const sampleChecks = [
      {
        checkId: 'VISUAL-001',
        manufacturingOrderId,
        operationId,
        workCenterId,
        name: 'Visual Inspection',
        description: 'Check for visual defects, scratches, and surface quality',
        type: 'VISUAL' as const,
        specification: 'No visible defects',
        sequence: 1,
        isRequired: true,
        status: 'PENDING' as const,
        isActive: true,
      },
      {
        checkId: 'DIM-001',
        manufacturingOrderId,
        operationId,
        workCenterId,
        name: 'Dimensional Check',
        description: 'Measure critical dimensions with calipers',
        type: 'DIMENSIONAL' as const,
        specification: '100mm ± 0.1mm',
        tolerance: '±0.1mm',
        unit: 'mm',
        targetValue: 100,
        minValue: 99.9,
        maxValue: 100.1,
        sequence: 2,
        isRequired: true,
        status: 'PENDING' as const,
        isActive: true,
      }
    ];

    const createdChecks: EnhancedQualityCheck[] = [];
    for (const checkData of sampleChecks) {
      const dbData = this.convertKeysToSnakeCase(checkData);
      
      const columns = Object.keys(dbData);
      const values = Object.values(dbData);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING 
          id,
          check_id as "checkId",
          manufacturing_order_id as "manufacturingOrderId",
          operation_id as "operationId",
          work_center_id as "workCenterId",
          name,
          description,
          type,
          specification,
          tolerance,
          unit,
          target_value as "targetValue",
          min_value as "minValue",
          max_value as "maxValue",
          status,
          sequence,
          is_required as "isRequired",
          result,
          measured_value as "measuredValue",
          notes,
          planned_start_time as "plannedStartTime",
          actual_start_time as "actualStartTime",
          planned_end_time as "plannedEndTime",
          actual_end_time as "actualEndTime",
          inspector_id as "inspectorId",
          inspector_name as "inspectorName",
          requires_second_check as "requiresSecondCheck",
          second_check_by as "secondCheckBy",
          second_check_result as "secondCheckResult",
          non_conformance_id as "nonConformanceId",
          corrective_action as "correctiveAction",
          attachments,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt",
          version
      `;

      const result = await this.executeQuery<EnhancedQualityCheck>(query, values);
      createdChecks.push(result.rows[0]);
    }

    return createdChecks;
  }
}
