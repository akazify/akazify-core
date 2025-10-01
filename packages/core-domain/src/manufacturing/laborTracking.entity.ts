import { z } from 'zod';
import { BaseEntitySchema } from '../common/base.entity';

export const LaborEntryType = {
  CLOCK_IN: 'CLOCK_IN',
  CLOCK_OUT: 'CLOCK_OUT',
  BREAK_START: 'BREAK_START',
  BREAK_END: 'BREAK_END',
} as const;

export type LaborEntryTypeType = typeof LaborEntryType[keyof typeof LaborEntryType];

export const LaborAssignmentSchema = BaseEntitySchema.extend({
  operationId: z.string().uuid(),
  operatorId: z.string().uuid(),
  operatorName: z.string().max(100),
  role: z.enum(['PRIMARY', 'ASSISTANT']),
  clockInTime: z.date().optional(),
  clockOutTime: z.date().optional(),
  status: z.enum(['ASSIGNED', 'ACTIVE', 'OFFLINE']),
  isActive: z.boolean().default(true),
});

export type LaborAssignment = z.infer<typeof LaborAssignmentSchema>;
