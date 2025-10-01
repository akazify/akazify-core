import { z } from 'zod';
import { BaseEntitySchema } from '../common/base.entity';

/**
 * Quality Check Status enum
 */
export const QualityCheckStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

export type QualityCheckStatusType = typeof QualityCheckStatus[keyof typeof QualityCheckStatus];

/**
 * Quality Check Type enum
 */
export const QualityCheckType = {
  VISUAL: 'VISUAL',           // Visual inspection
  DIMENSIONAL: 'DIMENSIONAL', // Measurement checks
  FUNCTIONAL: 'FUNCTIONAL',   // Performance testing
  MATERIAL: 'MATERIAL',       // Material properties
  SAFETY: 'SAFETY',          // Safety compliance
  CUSTOM: 'CUSTOM',          // Custom inspection
} as const;

export type QualityCheckTypeType = typeof QualityCheckType[keyof typeof QualityCheckType];

/**
 * Quality Check Result enum
 */
export const QualityCheckResult = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  CONDITIONAL_PASS: 'CONDITIONAL_PASS', // Pass with conditions/rework
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;

export type QualityCheckResultType = typeof QualityCheckResult[keyof typeof QualityCheckResult];

/**
 * Enhanced Quality Check entity schema
 * Represents individual quality inspections that can be associated with manufacturing operations
 */
export const EnhancedQualityCheckSchema = BaseEntitySchema.extend({
  // Identifiers
  checkId: z.string().min(1).max(50).describe('Unique quality check identifier (e.g., QC-001, VISUAL-01)'),
  manufacturingOrderId: z.string().uuid().describe('Associated manufacturing order'),
  operationId: z.string().uuid().optional().describe('Associated manufacturing operation (if operation-specific)'),
  workCenterId: z.string().uuid().optional().describe('Work center where check is performed'),

  // Check Definition
  name: z.string().min(1).max(200).describe('Quality check name'),
  description: z.string().max(1000).optional().describe('Detailed description of what to check'),
  type: z.nativeEnum(QualityCheckType).describe('Type of quality check'),
  
  // Inspection Details
  specification: z.string().max(500).optional().describe('Specification or standard to check against'),
  tolerance: z.string().max(100).optional().describe('Acceptable tolerance (e.g., ±0.1mm, 95-105%)'),
  unit: z.string().max(20).optional().describe('Unit of measurement (mm, %, pcs, etc.)'),
  
  // Target Values
  targetValue: z.number().optional().describe('Target/nominal value'),
  minValue: z.number().optional().describe('Minimum acceptable value'),
  maxValue: z.number().optional().describe('Maximum acceptable value'),
  
  // Execution
  status: z.nativeEnum(QualityCheckStatus).default(QualityCheckStatus.PENDING).describe('Current status'),
  sequence: z.number().int().min(1).describe('Order of execution within operation/MO'),
  isRequired: z.boolean().default(true).describe('Whether this check is mandatory'),
  
  // Results
  result: z.nativeEnum(QualityCheckResult).optional().describe('Overall result'),
  measuredValue: z.number().optional().describe('Actual measured value'),
  notes: z.string().max(1000).optional().describe('Inspector notes and observations'),
  
  // Timing
  plannedStartTime: z.date().optional().describe('Planned start time for inspection'),
  actualStartTime: z.date().optional().describe('Actual start time'),
  plannedEndTime: z.date().optional().describe('Planned completion time'),
  actualEndTime: z.date().optional().describe('Actual completion time'),
  
  // Personnel
  inspectorId: z.string().uuid().optional().describe('Inspector/operator who performed the check'),
  inspectorName: z.string().max(100).optional().describe('Inspector name for display'),
  
  // Quality Control
  requiresSecondCheck: z.boolean().default(false).describe('Requires secondary inspection'),
  secondCheckBy: z.string().uuid().optional().describe('Secondary inspector ID'),
  secondCheckResult: z.nativeEnum(QualityCheckResult).optional().describe('Secondary check result'),
  
  // Non-conformance
  nonConformanceId: z.string().uuid().optional().describe('Associated non-conformance record'),
  correctiveAction: z.string().max(500).optional().describe('Required corrective action'),
  
  // Attachments and Evidence
  attachments: z.array(z.object({
    id: z.string().uuid(),
    filename: z.string(),
    fileType: z.string(),
    filePath: z.string(),
    uploadedAt: z.date(),
    uploadedBy: z.string().uuid(),
  })).optional().describe('Photos, documents, certificates'),
  
  // Metadata
  isActive: z.boolean().default(true).describe('Soft delete flag'),
});

export type EnhancedQualityCheck = z.infer<typeof EnhancedQualityCheckSchema>;

/**
 * Quality Check Template schema
 * Defines reusable quality check templates that can be applied to operations
 */
export const QualityCheckTemplateSchema = BaseEntitySchema.extend({
  // Template Identity
  templateId: z.string().min(1).max(50).describe('Template identifier (e.g., VISUAL-WELD, DIM-CNC)'),
  name: z.string().min(1).max(200).describe('Template name'),
  description: z.string().max(1000).optional().describe('Template description'),
  
  // Scope
  workCenterTypes: z.array(z.string()).optional().describe('Applicable work center types'),
  operationTypes: z.array(z.string()).optional().describe('Applicable operation types'),
  productTypes: z.array(z.string()).optional().describe('Applicable product types'),
  
  // Check Definition (same as QualityCheck but as template)
  type: z.nativeEnum(QualityCheckType).describe('Type of quality check'),
  specification: z.string().max(500).optional().describe('Specification or standard'),
  tolerance: z.string().max(100).optional().describe('Acceptable tolerance'),
  unit: z.string().max(20).optional().describe('Unit of measurement'),
  
  // Default Values
  defaultTargetValue: z.number().optional().describe('Default target value'),
  defaultMinValue: z.number().optional().describe('Default minimum value'),
  defaultMaxValue: z.number().optional().describe('Default maximum value'),
  
  // Configuration
  isRequired: z.boolean().default(true).describe('Whether check is mandatory by default'),
  requiresSecondCheck: z.boolean().default(false).describe('Requires secondary inspection'),
  estimatedDuration: z.number().int().optional().describe('Estimated duration in minutes'),
  
  // Instructions
  instructions: z.string().max(2000).optional().describe('Detailed inspection instructions'),
  checklistItems: z.array(z.object({
    id: z.string(),
    description: z.string(),
    isRequired: z.boolean().default(true),
  })).optional().describe('Checklist items for the inspection'),
  
  // Metadata
  isActive: z.boolean().default(true).describe('Template is active'),
});

export type QualityCheckTemplate = z.infer<typeof QualityCheckTemplateSchema>;

/**
 * Quality Check Summary for operation/MO level reporting
 */
export const QualityCheckSummarySchema = z.object({
  manufacturingOrderId: z.string().uuid(),
  operationId: z.string().uuid().optional(),
  
  // Counts
  totalChecks: z.number().int().min(0),
  pendingChecks: z.number().int().min(0),
  inProgressChecks: z.number().int().min(0),
  passedChecks: z.number().int().min(0),
  failedChecks: z.number().int().min(0),
  skippedChecks: z.number().int().min(0),
  
  // Status
  overallStatus: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'MIXED']),
  firstPassYield: z.number().min(0).max(100).optional().describe('Percentage passed on first attempt'),
  
  // Timing
  totalPlannedDuration: z.number().optional().describe('Total planned inspection time (minutes)'),
  totalActualDuration: z.number().optional().describe('Total actual inspection time (minutes)'),
  
  // Quality Metrics
  averageScore: z.number().min(0).max(100).optional().describe('Average quality score'),
  criticalFailures: z.number().int().min(0).describe('Number of critical failures'),
  
  // Summary
  lastUpdated: z.date(),
});

export type QualityCheckSummary = z.infer<typeof QualityCheckSummarySchema>;

/**
 * Quality Check creation request (for API)
 */
export const CreateEnhancedQualityCheckRequestSchema = EnhancedQualityCheckSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

export type CreateEnhancedQualityCheckRequest = z.infer<typeof CreateEnhancedQualityCheckRequestSchema>;

/**
 * Quality Check update request (for API)
 */
export const UpdateEnhancedQualityCheckRequestSchema = EnhancedQualityCheckSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

export type UpdateEnhancedQualityCheckRequest = z.infer<typeof UpdateEnhancedQualityCheckRequestSchema>;
