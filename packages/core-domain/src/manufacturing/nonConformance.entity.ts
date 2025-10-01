import { z } from 'zod';
import { BaseEntitySchema } from '../schemas';

/**
 * Non-conformance Severity enum
 */
export const NCRSeverity = {
  MINOR: 'MINOR',         // Minor quality issues
  MAJOR: 'MAJOR',         // Significant quality problems
  CRITICAL: 'CRITICAL',   // Safety or compliance issues
} as const;

export type NCRSeverityType = typeof NCRSeverity[keyof typeof NCRSeverity];

/**
 * Non-conformance Status enum
 */
export const NCRStatus = {
  OPEN: 'OPEN',               // New non-conformance reported
  INVESTIGATING: 'INVESTIGATING', // Under investigation
  CORRECTIVE_ACTION: 'CORRECTIVE_ACTION', // Corrective action in progress
  RESOLVED: 'RESOLVED',       // Issue resolved
  CLOSED: 'CLOSED',           // NCR closed and verified
} as const;

export type NCRStatusType = typeof NCRStatus[keyof typeof NCRStatus];

/**
 * Non-conformance Category enum
 */
export const NCRCategory = {
  MATERIAL_DEFECT: 'MATERIAL_DEFECT',
  DIMENSIONAL: 'DIMENSIONAL',
  SURFACE_FINISH: 'SURFACE_FINISH',
  FUNCTIONAL: 'FUNCTIONAL',
  PACKAGING: 'PACKAGING',
  DOCUMENTATION: 'DOCUMENTATION',
  PROCESS: 'PROCESS',
  SAFETY: 'SAFETY',
  OTHER: 'OTHER',
} as const;

export type NCRCategoryType = typeof NCRCategory[keyof typeof NCRCategory];

/**
 * Non-conformance Report schema
 */
export const NonConformanceReportSchema = BaseEntitySchema.extend({
  // Identifiers
  ncrNumber: z.string().min(1).max(50).describe('NCR reference number'),
  operationId: z.string().uuid().optional().describe('Related operation'),
  manufacturingOrderId: z.string().uuid().optional().describe('Related manufacturing order'),
  qualityCheckId: z.string().uuid().optional().describe('Related quality check'),
  productId: z.string().uuid().describe('Product affected'),
  lotId: z.string().uuid().optional().describe('Lot/batch affected'),
  
  // Classification
  category: z.nativeEnum(NCRCategory).describe('Non-conformance category'),
  severity: z.nativeEnum(NCRSeverity).describe('Severity level'),
  status: z.nativeEnum(NCRStatus).default(NCRStatus.OPEN).describe('Current status'),
  
  // Description
  title: z.string().min(1).max(200).describe('Short description'),
  description: z.string().min(1).max(1000).describe('Detailed description'),
  rootCause: z.string().max(500).optional().describe('Root cause analysis'),
  
  // People
  reportedBy: z.string().uuid().describe('Who reported the NCR'),
  reportedByName: z.string().max(100).describe('Reporter name'),
  assignedTo: z.string().uuid().optional().describe('Assigned investigator'),
  assignedToName: z.string().max(100).optional().describe('Investigator name'),
  
  // Quantities
  quantityAffected: z.number().min(0).describe('Quantity of affected items'),
  quantityRejected: z.number().min(0).default(0).describe('Quantity rejected'),
  quantityReworked: z.number().min(0).default(0).describe('Quantity reworked'),
  quantityAccepted: z.number().min(0).default(0).describe('Quantity accepted as-is'),
  
  // Costs
  estimatedCost: z.number().min(0).optional().describe('Estimated cost impact'),
  actualCost: z.number().min(0).optional().describe('Actual cost impact'),
  
  // Timing
  detectedAt: z.date().describe('When was it detected'),
  reportedAt: z.date().describe('When was it reported'),
  targetCloseDate: z.date().optional().describe('Target resolution date'),
  actualCloseDate: z.date().optional().describe('Actual resolution date'),
  
  // Actions
  immediateAction: z.string().max(500).optional().describe('Immediate containment action'),
  correctiveAction: z.string().max(500).optional().describe('Corrective action plan'),
  preventiveAction: z.string().max(500).optional().describe('Preventive action plan'),
  
  // Verification
  verifiedBy: z.string().uuid().optional().describe('Who verified the resolution'),
  verifiedByName: z.string().max(100).optional().describe('Verifier name'),
  verificationDate: z.date().optional().describe('When was it verified'),
  verificationNotes: z.string().max(500).optional().describe('Verification notes'),
  
  // Attachments and References
  attachments: z.array(z.string()).default([]).describe('File attachments'),
  references: z.array(z.string()).default([]).describe('Related NCRs or documents'),
  
  // Metadata
  isActive: z.boolean().default(true),
});

export type NonConformanceReport = z.infer<typeof NonConformanceReportSchema>;

/**
 * NCR Summary for dashboards
 */
export const NCRSummarySchema = z.object({
  operationId: z.string().uuid().optional(),
  manufacturingOrderId: z.string().uuid().optional(),
  
  // Counts by status
  totalNCRs: z.number().int().min(0),
  openNCRs: z.number().int().min(0),
  investigatingNCRs: z.number().int().min(0),
  resolvedNCRs: z.number().int().min(0),
  closedNCRs: z.number().int().min(0),
  
  // Counts by severity
  minorNCRs: z.number().int().min(0),
  majorNCRs: z.number().int().min(0),
  criticalNCRs: z.number().int().min(0),
  
  // Performance metrics
  averageResolutionDays: z.number().min(0),
  overdueNCRs: z.number().int().min(0),
  
  // Cost impact
  totalEstimatedCost: z.number().min(0),
  totalActualCost: z.number().min(0),
  
  lastUpdated: z.date(),
});

export type NCRSummary = z.infer<typeof NCRSummarySchema>;

/**
 * Create NCR request
 */
export const CreateNCRRequestSchema = NonConformanceReportSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  ncrNumber: true, // Auto-generated
});

export type CreateNCRRequest = z.infer<typeof CreateNCRRequestSchema>;
