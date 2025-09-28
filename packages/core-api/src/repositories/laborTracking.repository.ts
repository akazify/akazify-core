import { Pool } from 'pg';
import { BaseRepository } from './base';
import { LaborAssignment, LaborEntryTypeType } from '@akazify/core-domain';

export class LaborTrackingRepository extends BaseRepository<LaborAssignment> {
  constructor(pool: Pool) {
    super(pool, 'labor_assignments');
  }

  /**
   * Find labor assignments for an operation
   */
  async findByOperationId(operationId: string): Promise<LaborAssignment[]> {
    const query = `
      SELECT 
        id,
        operation_id as "operationId",
        operator_id as "operatorId",
        operator_number as "operatorNumber",
        operator_name as "operatorName",
        role,
        clock_in_time as "clockInTime",
        clock_out_time as "clockOutTime",
        planned_hours as "plannedHours",
        actual_hours as "actualHours",
        status,
        hourly_rate as "hourlyRate",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM ${this.tableName}
      WHERE operation_id = $1 AND is_active = true
      ORDER BY created_at ASC
    `;
    
    const result = await this.executeQuery<LaborAssignment>(query, [operationId]);
    return result.rows;
  }

  /**
   * Find active assignments for an operator
   */
  async findByOperatorId(operatorId: string): Promise<LaborAssignment[]> {
    const query = `
      SELECT 
        id,
        operation_id as "operationId",
        operator_id as "operatorId",
        operator_number as "operatorNumber",
        operator_name as "operatorName",
        role,
        clock_in_time as "clockInTime",
        clock_out_time as "clockOutTime",
        planned_hours as "plannedHours",
        actual_hours as "actualHours",
        status,
        hourly_rate as "hourlyRate",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM ${this.tableName}
      WHERE operator_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    
    const result = await this.executeQuery<LaborAssignment>(query, [operatorId]);
    return result.rows;
  }

  /**
   * Clock in an operator
   */
  async clockIn(assignmentId: string): Promise<LaborAssignment | null> {
    const query = `
      UPDATE ${this.tableName}
      SET 
        clock_in_time = NOW(),
        status = 'ACTIVE',
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1 AND is_active = true
      RETURNING 
        id,
        operation_id as "operationId",
        operator_id as "operatorId",
        operator_number as "operatorNumber",
        operator_name as "operatorName",
        role,
        clock_in_time as "clockInTime",
        clock_out_time as "clockOutTime",
        planned_hours as "plannedHours",
        actual_hours as "actualHours",
        status,
        hourly_rate as "hourlyRate",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
    `;
    
    const result = await this.executeQuery<LaborAssignment>(query, [assignmentId]);
    return result.rows[0] || null;
  }

  /**
   * Clock out an operator
   */
  async clockOut(assignmentId: string): Promise<LaborAssignment | null> {
    const query = `
      UPDATE ${this.tableName}
      SET 
        clock_out_time = NOW(),
        status = 'OFFLINE',
        actual_hours = EXTRACT(EPOCH FROM (NOW() - clock_in_time)) / 3600.0,
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1 AND is_active = true
      RETURNING 
        id,
        operation_id as "operationId",
        operator_id as "operatorId",
        operator_number as "operatorNumber",
        operator_name as "operatorName",
        role,
        clock_in_time as "clockInTime",
        clock_out_time as "clockOutTime",
        planned_hours as "plannedHours",
        actual_hours as "actualHours",
        status,
        hourly_rate as "hourlyRate",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
    `;
    
    const result = await this.executeQuery<LaborAssignment>(query, [assignmentId]);
    return result.rows[0] || null;
  }

  /**
   * Start break
   */
  async startBreak(assignmentId: string): Promise<LaborAssignment | null> {
    const query = `
      UPDATE ${this.tableName}
      SET 
        status = 'ON_BREAK',
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1 AND is_active = true
      RETURNING 
        id,
        operation_id as "operationId",
        operator_id as "operatorId",
        operator_number as "operatorNumber",
        operator_name as "operatorName",
        role,
        clock_in_time as "clockInTime",
        clock_out_time as "clockOutTime",
        planned_hours as "plannedHours",
        actual_hours as "actualHours",
        status,
        hourly_rate as "hourlyRate",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
    `;
    
    const result = await this.executeQuery<LaborAssignment>(query, [assignmentId]);
    return result.rows[0] || null;
  }

  /**
   * End break
   */
  async endBreak(assignmentId: string): Promise<LaborAssignment | null> {
    const query = `
      UPDATE ${this.tableName}
      SET 
        status = 'ACTIVE',
        updated_at = NOW(),
        version = version + 1
      WHERE id = $1 AND is_active = true
      RETURNING 
        id,
        operation_id as "operationId",
        operator_id as "operatorId",
        operator_number as "operatorNumber",
        operator_name as "operatorName",
        role,
        clock_in_time as "clockInTime",
        clock_out_time as "clockOutTime",
        planned_hours as "plannedHours",
        actual_hours as "actualHours",
        status,
        hourly_rate as "hourlyRate",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
    `;
    
    const result = await this.executeQuery<LaborAssignment>(query, [assignmentId]);
    return result.rows[0] || null;
  }

  /**
   * Get labor summary for operation
   */
  async getLaborSummary(operationId: string) {
    const query = `
      SELECT 
        COUNT(*) as "totalOperators",
        SUM(COALESCE(actual_hours, 0)) as "totalHours",
        SUM(COALESCE(actual_hours * hourly_rate, 0)) as "totalCost",
        AVG(CASE WHEN planned_hours > 0 THEN (actual_hours / planned_hours) * 100 ELSE 100 END) as efficiency
      FROM ${this.tableName}
      WHERE operation_id = $1 AND is_active = true
    `;
    
    const result = await this.executeQuery(query, [operationId]);
    return result.rows[0];
  }

}
