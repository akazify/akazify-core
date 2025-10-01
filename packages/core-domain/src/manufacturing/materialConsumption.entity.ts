import { z } from 'zod';
import { BaseEntitySchema } from '../common/base.entity';

/**
 * Material Transaction Type enum
 */
export const MaterialTransactionType = {
  ALLOCATION: 'ALLOCATION',     // Material allocated to operation
  CONSUMPTION: 'CONSUMPTION',   // Material consumed during production
  RETURN: 'RETURN',            // Unused material returned to inventory
  WASTE: 'WASTE',              // Material wasted during production
  SCRAP: 'SCRAP',              // Defective material/products
} as const;

export type MaterialTransactionTypeType = typeof MaterialTransactionType[keyof typeof MaterialTransactionType];

/**
 * Material Consumption schema
 * Tracks material usage and waste during manufacturing operations
 */
export const MaterialConsumptionSchema = BaseEntitySchema.extend({
  // Identifiers
  operationId: z.string().uuid().describe('Manufacturing order operation'),
  manufacturingOrderId: z.string().uuid().describe('Manufacturing order'),
  productId: z.string().uuid().describe('Material/component product ID'),
  bomItemId: z.string().uuid().optional().describe('BOM item reference'),
  lotId: z.string().uuid().optional().describe('Material lot/batch'),
  
  // Material Details
  sku: z.string().min(1).max(50).describe('Material SKU'),
  productName: z.string().min(1).max(200).describe('Material name'),
  uom: z.string().min(1).max(20).describe('Unit of measure'),
  
  // Transaction Info
  transactionType: z.nativeEnum(MaterialTransactionType).describe('Type of material transaction'),
  
  // Quantities
  plannedQuantity: z.number().min(0).describe('Planned quantity per BOM'),
  allocatedQuantity: z.number().min(0).describe('Quantity allocated to operation'),
  consumedQuantity: z.number().min(0).default(0).describe('Actual quantity consumed'),
  wasteQuantity: z.number().min(0).default(0).describe('Quantity wasted'),
  returnedQuantity: z.number().min(0).default(0).describe('Quantity returned unused'),
  
  // Costing
  unitCost: z.number().min(0).optional().describe('Cost per unit'),
  totalCost: z.number().min(0).optional().describe('Total material cost'),
  wasteCost: z.number().min(0).optional().describe('Cost of waste'),
  
  // Waste Analysis
  wasteFactor: z.number().min(0).max(1).default(0).describe('Expected waste factor (0-1)'),
  wasteReason: z.string().max(200).optional().describe('Reason for waste'),
  wasteCategory: z.enum(['NORMAL', 'REWORK', 'DEFECT', 'SETUP', 'OTHER']).optional(),
  
  // Timestamps
  transactionDate: z.date().describe('When transaction occurred'),
  recordedBy: z.string().uuid().optional().describe('Operator who recorded'),
  
  // Location Tracking
  fromLocationId: z.string().uuid().optional().describe('Source location'),
  toLocationId: z.string().uuid().optional().describe('Destination location'),
  
  // Notes
  notes: z.string().max(500).optional().describe('Transaction notes'),
  
  // Metadata
  isActive: z.boolean().default(true),
});

export type MaterialConsumption = z.infer<typeof MaterialConsumptionSchema>;

/**
 * Material Summary for operations
 */
export const MaterialSummarySchema = z.object({
  operationId: z.string().uuid(),
  manufacturingOrderId: z.string().uuid(),
  
  // Totals
  totalMaterials: z.number().int().min(0),
  totalPlannedCost: z.number().min(0),
  totalActualCost: z.number().min(0),
  totalWasteCost: z.number().min(0),
  
  // Efficiency
  materialEfficiency: z.number().min(0).max(200).describe('Actual vs planned material usage %'),
  wastePercentage: z.number().min(0).max(100).describe('Waste as % of total consumption'),
  
  // Status
  allMaterialsAllocated: z.boolean(),
  allMaterialsConsumed: z.boolean(),
  hasExcessiveWaste: z.boolean(),
  
  // Timestamps
  lastUpdated: z.date(),
});

export type MaterialSummary = z.infer<typeof MaterialSummarySchema>;

/**
 * Material Allocation (planned usage per operation)
 */
export const MaterialAllocationSchema = BaseEntitySchema.extend({
  operationId: z.string().uuid(),
  manufacturingOrderId: z.string().uuid(),
  productId: z.string().uuid(),
  bomItemId: z.string().uuid(),
  
  // Allocation Details
  sku: z.string().max(50),
  productName: z.string().max(200),
  uom: z.string().max(20),
  requiredQuantity: z.number().min(0),
  allocatedQuantity: z.number().min(0).default(0),
  consumedQuantity: z.number().min(0).default(0),
  
  // Costing
  unitCost: z.number().min(0),
  totalCost: z.number().min(0),
  
  // Status
  isFullyAllocated: z.boolean().default(false),
  isFullyConsumed: z.boolean().default(false),
  
  // Waste Planning
  wasteFactor: z.number().min(0).max(1).default(0.02), // 2% default waste
  
  isActive: z.boolean().default(true),
});

export type MaterialAllocation = z.infer<typeof MaterialAllocationSchema>;

/**
 * Create material consumption request
 */
export const CreateMaterialConsumptionRequestSchema = MaterialConsumptionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

export type CreateMaterialConsumptionRequest = z.infer<typeof CreateMaterialConsumptionRequestSchema>;
