import { z } from 'zod';

/**
 * Akazify Core Domain Schemas
 *
 * Based on ISA-95 standards for manufacturing operations management.
 * These schemas provide type-safe validation and serve as the foundation
 * for API contracts and data persistence.
 */

// Base entity schema with common fields
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number().int().positive(),
});

// Location and physical hierarchy
export const SiteSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true),
});

export const AreaSchema = BaseEntitySchema.extend({
  siteId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  parentAreaId: z.string().uuid().optional(),
  level: z.number().int().min(1).max(5), // Area hierarchy level
  isActive: z.boolean().default(true),
});

export const WorkCenterSchema = BaseEntitySchema.extend({
  areaId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  category: z.enum(['PRODUCTION', 'ASSEMBLY', 'PACKAGING', 'QUALITY', 'MAINTENANCE']),
  capacity: z.number().positive().optional(), // Units per hour
  isActive: z.boolean().default(true),
});

export const EquipmentSchema = BaseEntitySchema.extend({
  workCenterId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  equipmentType: z.enum(['MACHINE', 'TOOL', 'SENSOR', 'CONVEYOR', 'ROBOT', 'OTHER']),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  installationDate: z.date().optional(),
  lastMaintenanceDate: z.date().optional(),
  status: z.enum(['OPERATIONAL', 'DOWN', 'MAINTENANCE', 'OFFLINE']).default('OPERATIONAL'),
  isActive: z.boolean().default(true),
});

// Product and engineering data
export const ProductSchema = BaseEntitySchema.extend({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  uom: z.string().min(1).max(20), // Unit of Measure
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    unit: z.string().default('mm'),
  }).optional(),
  isActive: z.boolean().default(true),
});

export const BOMSchema = BaseEntitySchema.extend({
  productId: z.string().uuid(),
  version: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const BOMItemSchema = BaseEntitySchema.extend({
  bomId: z.string().uuid(),
  componentProductId: z.string().uuid(),
  quantity: z.number().positive(),
  uom: z.string().min(1).max(20),
  operationSequence: z.number().int().positive().optional(),
  wasteFactor: z.number().min(0).max(1).default(0), // Scrap factor
  isActive: z.boolean().default(true),
});

export const RoutingSchema = BaseEntitySchema.extend({
  productId: z.string().uuid(),
  version: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const RoutingStepSchema = BaseEntitySchema.extend({
  routingId: z.string().uuid(),
  workCenterId: z.string().uuid(),
  operationId: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sequence: z.number().int().positive(),
  setupTime: z.number().min(0).optional(), // Minutes
  runTime: z.number().min(0).optional(), // Minutes per unit
  teardownTime: z.number().min(0).optional(), // Minutes
  isActive: z.boolean().default(true),
});

// Inventory management
export const LocationSchema = BaseEntitySchema.extend({
  siteId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  type: z.enum(['WAREHOUSE', 'PRODUCTION', 'SHIPPING', 'RECEIVING', 'QUALITY']),
  parentLocationId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

export const BinSchema = BaseEntitySchema.extend({
  locationId: z.string().uuid(),
  name: z.string().min(1).max(50),
  code: z.string().min(1).max(20),
  capacity: z.number().positive().optional(),
  isActive: z.boolean().default(true),
});

export const LotSchema = BaseEntitySchema.extend({
  productId: z.string().uuid(),
  lotNumber: z.string().min(1).max(50),
  quantity: z.number().min(0),
  uom: z.string().min(1).max(20),
  expiryDate: z.date().optional(),
  manufactureDate: z.date().optional(),
  supplierId: z.string().optional(),
  status: z.enum(['AVAILABLE', 'QUARANTINED', 'EXPIRED', 'CONSUMED']).default('AVAILABLE'),
  isActive: z.boolean().default(true),
});

export const SerialNumberSchema = BaseEntitySchema.extend({
  productId: z.string().uuid(),
  serialNumber: z.string().min(1).max(50),
  lotId: z.string().uuid().optional(),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'CONSUMED', 'SCRAPPED']).default('AVAILABLE'),
  locationId: z.string().uuid().optional(),
  binId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

// Manufacturing execution
export const ManufacturingOrderSchema = BaseEntitySchema.extend({
  orderNumber: z.string().min(1).max(50),
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  uom: z.string().min(1).max(20),
  bomId: z.string().uuid().optional(),
  routingId: z.string().uuid().optional(),
  plannedStartDate: z.date(),
  plannedEndDate: z.date(),
  actualStartDate: z.date().optional(),
  actualEndDate: z.date().optional(),
  status: z.enum([
    'PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  ]).default('PLANNED'),
  priority: z.number().int().min(1).max(10).default(5),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const ManufacturingOrderOperationSchema = BaseEntitySchema.extend({
  manufacturingOrderId: z.string().uuid(),
  workCenterId: z.string().uuid(),
  operationId: z.string().min(1).max(50),
  sequence: z.number().int().positive(),
  plannedQuantity: z.number().positive(),
  completedQuantity: z.number().min(0).default(0),
  status: z.enum([
    'WAITING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'
  ]).default('WAITING'),
  plannedStartTime: z.date().optional(),
  actualStartTime: z.date().optional(),
  plannedEndTime: z.date().optional(),
  actualEndTime: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Quality management
export const QualityCheckSchema = BaseEntitySchema.extend({
  manufacturingOrderId: z.string().uuid(),
  operationId: z.string().min(1).max(50),
  productId: z.string().uuid(),
  checkType: z.enum(['IN_PROCESS', 'FINAL', 'RECEIVING', 'SHIPPING']),
  status: z.enum(['PENDING', 'PASSED', 'FAILED', 'WAIVED']).default('PENDING'),
  checklist: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    specification: z.string().optional(),
    actualValue: z.union([z.string(), z.number()]).optional(),
    unit: z.string().optional(),
    passed: z.boolean().optional(),
    notes: z.string().optional(),
  })),
  isActive: z.boolean().default(true),
});

// Maintenance
export const WorkOrderSchema = BaseEntitySchema.extend({
  equipmentId: z.string().uuid(),
  orderNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.enum([
    'OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED'
  ]).default('OPEN'),
  workType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'INSPECTION']),
  plannedStartDate: z.date(),
  plannedEndDate: z.date(),
  actualStartDate: z.date().optional(),
  actualEndDate: z.date().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
});

export const WorkOrderTaskSchema = BaseEntitySchema.extend({
  workOrderId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sequence: z.number().int().positive(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING'),
  assignedTo: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
});

// Type exports
export type Site = z.infer<typeof SiteSchema>;
export type Area = z.infer<typeof AreaSchema>;
export type WorkCenter = z.infer<typeof WorkCenterSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type BOM = z.infer<typeof BOMSchema>;
export type BOMItem = z.infer<typeof BOMItemSchema>;
export type Routing = z.infer<typeof RoutingSchema>;
export type RoutingStep = z.infer<typeof RoutingStepSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Bin = z.infer<typeof BinSchema>;
export type Lot = z.infer<typeof LotSchema>;
export type SerialNumber = z.infer<typeof SerialNumberSchema>;
export type ManufacturingOrder = z.infer<typeof ManufacturingOrderSchema>;
export type ManufacturingOrderOperation = z.infer<typeof ManufacturingOrderOperationSchema>;
export type QualityCheck = z.infer<typeof QualityCheckSchema>;
export type WorkOrder = z.infer<typeof WorkOrderSchema>;
export type WorkOrderTask = z.infer<typeof WorkOrderTaskSchema>;
