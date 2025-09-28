import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { QualityCheckRepository } from '../repositories/qualityCheck.repository';

// Request/Response schemas using TypeBox for Fastify
const QualityCheckResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  checkId: Type.String({ maxLength: 50 }),
  manufacturingOrderId: Type.String({ format: 'uuid' }),
  operationId: Type.Optional(Type.String({ format: 'uuid' })),
  workCenterId: Type.Optional(Type.String({ format: 'uuid' })),
  name: Type.String({ maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 1000 })),
  type: Type.Union([
    Type.Literal('VISUAL'),
    Type.Literal('DIMENSIONAL'),
    Type.Literal('FUNCTIONAL'),
    Type.Literal('MATERIAL'),
    Type.Literal('SAFETY'),
    Type.Literal('CUSTOM')
  ]),
  specification: Type.Optional(Type.String({ maxLength: 500 })),
  tolerance: Type.Optional(Type.String({ maxLength: 100 })),
  unit: Type.Optional(Type.String({ maxLength: 20 })),
  targetValue: Type.Optional(Type.Number()),
  minValue: Type.Optional(Type.Number()),
  maxValue: Type.Optional(Type.Number()),
  status: Type.Union([
    Type.Literal('PENDING'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('PASSED'),
    Type.Literal('FAILED'),
    Type.Literal('SKIPPED')
  ]),
  sequence: Type.Integer({ minimum: 1 }),
  isRequired: Type.Boolean({ default: true }),
  result: Type.Optional(Type.Union([
    Type.Literal('PASS'),
    Type.Literal('FAIL'),
    Type.Literal('CONDITIONAL_PASS'),
    Type.Literal('NOT_APPLICABLE')
  ])),
  measuredValue: Type.Optional(Type.Number()),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
  plannedStartTime: Type.Optional(Type.String({ format: 'date-time' })),
  actualStartTime: Type.Optional(Type.String({ format: 'date-time' })),
  plannedEndTime: Type.Optional(Type.String({ format: 'date-time' })),
  actualEndTime: Type.Optional(Type.String({ format: 'date-time' })),
  inspectorId: Type.Optional(Type.String({ format: 'uuid' })),
  inspectorName: Type.Optional(Type.String({ maxLength: 100 })),
  requiresSecondCheck: Type.Boolean({ default: false }),
  secondCheckBy: Type.Optional(Type.String({ format: 'uuid' })),
  secondCheckResult: Type.Optional(Type.Union([
    Type.Literal('PASS'),
    Type.Literal('FAIL'),
    Type.Literal('CONDITIONAL_PASS'),
    Type.Literal('NOT_APPLICABLE')
  ])),
  nonConformanceId: Type.Optional(Type.String({ format: 'uuid' })),
  correctiveAction: Type.Optional(Type.String({ maxLength: 500 })),
  isActive: Type.Boolean({ default: true }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  version: Type.Integer({ minimum: 1 }),
});

const QualityCheckWithDetailsSchema = Type.Intersect([
  QualityCheckResponseSchema,
  Type.Object({
    manufacturingOrderNumber: Type.Optional(Type.String()),
    operationName: Type.Optional(Type.String()),
    workCenterName: Type.Optional(Type.String()),
  })
]);

const CreateQualityCheckSchema = Type.Object({
  checkId: Type.String({ minLength: 1, maxLength: 50 }),
  manufacturingOrderId: Type.String({ format: 'uuid' }),
  operationId: Type.Optional(Type.String({ format: 'uuid' })),
  workCenterId: Type.Optional(Type.String({ format: 'uuid' })),
  name: Type.String({ minLength: 1, maxLength: 200 }),
  description: Type.Optional(Type.String({ maxLength: 1000 })),
  type: Type.Union([
    Type.Literal('VISUAL'),
    Type.Literal('DIMENSIONAL'),
    Type.Literal('FUNCTIONAL'),
    Type.Literal('MATERIAL'),
    Type.Literal('SAFETY'),
    Type.Literal('CUSTOM')
  ]),
  specification: Type.Optional(Type.String({ maxLength: 500 })),
  tolerance: Type.Optional(Type.String({ maxLength: 100 })),
  unit: Type.Optional(Type.String({ maxLength: 20 })),
  targetValue: Type.Optional(Type.Number()),
  minValue: Type.Optional(Type.Number()),
  maxValue: Type.Optional(Type.Number()),
  sequence: Type.Integer({ minimum: 1 }),
  isRequired: Type.Optional(Type.Boolean({ default: true })),
  plannedStartTime: Type.Optional(Type.String({ format: 'date-time' })),
  plannedEndTime: Type.Optional(Type.String({ format: 'date-time' })),
});

const UpdateQualityCheckStatusSchema = Type.Object({
  status: Type.Union([
    Type.Literal('PENDING'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('PASSED'),
    Type.Literal('FAILED'),
    Type.Literal('SKIPPED')
  ]),
  inspectorId: Type.Optional(Type.String({ format: 'uuid' })),
  inspectorName: Type.Optional(Type.String({ maxLength: 100 })),
});

const RecordResultsSchema = Type.Object({
  result: Type.Union([
    Type.Literal('PASS'),
    Type.Literal('FAIL'),
    Type.Literal('CONDITIONAL_PASS'),
    Type.Literal('NOT_APPLICABLE')
  ]),
  measuredValue: Type.Optional(Type.Number()),
  notes: Type.Optional(Type.String({ maxLength: 1000 })),
  inspectorId: Type.Optional(Type.String({ format: 'uuid' })),
  inspectorName: Type.Optional(Type.String({ maxLength: 100 })),
});

const QualityCheckIdParams = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

const MOIdParams = Type.Object({
  moId: Type.String({ format: 'uuid' }),
});

const OperationIdParams = Type.Object({
  operationId: Type.String({ format: 'uuid' }),
});

const QualitySummarySchema = Type.Object({
  totalChecks: Type.Integer(),
  pendingChecks: Type.Integer(),
  inProgressChecks: Type.Integer(),
  passedChecks: Type.Integer(),
  failedChecks: Type.Integer(),
  skippedChecks: Type.Integer(),
  overallStatus: Type.Union([
    Type.Literal('PENDING'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('PASSED'),
    Type.Literal('FAILED'),
    Type.Literal('MIXED')
  ]),
  firstPassYield: Type.Number(),
  criticalFailures: Type.Integer(),
});

const CreateFromTemplatesSchema = Type.Object({
  templateIds: Type.Array(Type.String()),
});

const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  sortBy: Type.Optional(Type.String({ default: 'sequence' })),
  sortOrder: Type.Optional(Type.Union([Type.Literal('ASC'), Type.Literal('DESC')], { default: 'ASC' })),
  manufacturingOrderId: Type.Optional(Type.String({ format: 'uuid' })),
  operationId: Type.Optional(Type.String({ format: 'uuid' })),
  workCenterId: Type.Optional(Type.String({ format: 'uuid' })),
  status: Type.Optional(Type.Union([
    Type.Literal('PENDING'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('PASSED'),
    Type.Literal('FAILED'),
    Type.Literal('SKIPPED')
  ])),
  result: Type.Optional(Type.Union([
    Type.Literal('PASS'),
    Type.Literal('FAIL'),
    Type.Literal('CONDITIONAL_PASS'),
    Type.Literal('NOT_APPLICABLE')
  ])),
  inspectorId: Type.Optional(Type.String({ format: 'uuid' })),
  checkType: Type.Optional(Type.String()),
  isRequired: Type.Optional(Type.Boolean()),
});

const PaginatedQualityCheckResponseSchema = Type.Object({
  data: Type.Array(QualityCheckWithDetailsSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean(),
  }),
});

/**
 * Quality Checks API routes
 */
export default async function qualityChecksRoutes(fastify: FastifyInstance) {
  const qcRepository = new QualityCheckRepository(fastify.pg.pool);

  // GET /manufacturing-orders/:moId/quality-checks - List quality checks for MO
  fastify.get('/manufacturing-orders/:moId/quality-checks', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'List quality checks for manufacturing order',
      description: 'Retrieve quality checks for a specific manufacturing order',
      params: MOIdParams,
      response: {
        200: Type.Array(QualityCheckResponseSchema),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { moId: string };
  }>, reply: FastifyReply) => {
    try {
      const { moId } = request.params;
      const qualityChecks = await qcRepository.findByManufacturingOrderId(moId);
      return reply.code(200).send(qualityChecks);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve quality checks'
      });
    }
  });

  // GET /manufacturing-orders/:moId/quality-summary - Get quality summary for MO
  fastify.get('/manufacturing-orders/:moId/quality-summary', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'Get quality summary for manufacturing order',
      description: 'Retrieve quality check summary statistics for a manufacturing order',
      params: MOIdParams,
      response: {
        200: QualitySummarySchema,
      },
    },
  }, async (request: FastifyRequest<{
    Params: { moId: string };
  }>, reply: FastifyReply) => {
    try {
      const { moId } = request.params;
      const summary = await qcRepository.getQualitySummaryByMO(moId);
      return reply.code(200).send(summary);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve quality summary'
      });
    }
  });

  // POST /operations/:operationId/quality-checks/from-templates - Create quality checks from templates
  fastify.post('/operations/:operationId/quality-checks/from-templates', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'Create quality checks from templates',
      description: 'Create quality checks for an operation using templates',
      params: OperationIdParams,
      body: CreateFromTemplatesSchema,
      response: {
        201: Type.Array(QualityCheckResponseSchema),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { operationId: string };
    Body: { templateIds: string[] };
  }>, reply: FastifyReply) => {
    try {
      const { operationId } = request.params;
      const { templateIds } = request.body;

      // For now, we need to get the MO and work center from the operation
      // In a real implementation, we'd fetch the operation details first
      const manufacturingOrderId = 'sample-mo-id'; // Would fetch from operation
      const workCenterId = 'sample-wc-id'; // Would fetch from operation

      const createdChecks = await qcRepository.createFromTemplates(
        manufacturingOrderId, 
        operationId, 
        workCenterId, 
        templateIds
      );
      return reply.code(201).send(createdChecks);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create quality checks'
      });
    }
  });

  // GET /quality-checks - List all quality checks with filtering
  fastify.get('/quality-checks', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'List quality checks',
      description: 'Retrieve a paginated list of quality checks with optional filtering',
      querystring: PaginationQuerySchema,
      response: {
        200: PaginatedQualityCheckResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      manufacturingOrderId?: string;
      operationId?: string;
      workCenterId?: string;
      status?: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'SKIPPED';
      result?: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'NOT_APPLICABLE';
      inspectorId?: string;
      checkType?: string;
      isRequired?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const { 
        page, limit, sortBy, sortOrder, 
        manufacturingOrderId, operationId, workCenterId, 
        status, result, inspectorId, checkType, isRequired 
      } = request.query;
      
      const result_data = await qcRepository.findWithDetails(
        { page, limit, sortBy, sortOrder },
        { manufacturingOrderId, operationId, workCenterId, status, result, inspectorId, checkType, isRequired }
      );
      
      return reply.code(200).send(result_data);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve quality checks'
      });
    }
  });

  // GET /quality-checks/:id - Get specific quality check
  fastify.get('/quality-checks/:id', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'Get quality check by ID',
      description: 'Retrieve a specific quality check',
      params: QualityCheckIdParams,
      response: {
        200: QualityCheckResponseSchema,
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const qualityCheck = await qcRepository.findById(id);
      
      if (!qualityCheck) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Quality check with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(qualityCheck);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve quality check'
      });
    }
  });

  // POST /quality-checks - Create new quality check
  fastify.post('/quality-checks', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'Create quality check',
      description: 'Create a new quality check',
      body: CreateQualityCheckSchema,
      response: {
        201: QualityCheckResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Body: {
      checkId: string;
      manufacturingOrderId: string;
      operationId?: string;
      workCenterId?: string;
      name: string;
      description?: string;
      type: 'VISUAL' | 'DIMENSIONAL' | 'FUNCTIONAL' | 'MATERIAL' | 'SAFETY' | 'CUSTOM';
      specification?: string;
      tolerance?: string;
      unit?: string;
      targetValue?: number;
      minValue?: number;
      maxValue?: number;
      sequence: number;
      isRequired?: boolean;
      plannedStartTime?: string;
      plannedEndTime?: string;
    };
  }>, reply: FastifyReply) => {
    try {
      const qcData = request.body;

      // Validate and process data
      const validatedData = {
        ...qcData,
        plannedStartTime: qcData.plannedStartTime ? new Date(qcData.plannedStartTime) : undefined,
        plannedEndTime: qcData.plannedEndTime ? new Date(qcData.plannedEndTime) : undefined,
        status: 'PENDING' as const,
        isActive: true,
      };

      const newQualityCheck = await qcRepository.create(validatedData);
      return reply.code(201).send(newQualityCheck);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create quality check'
      });
    }
  });

  // PUT /quality-checks/:id/status - Update quality check status
  fastify.put('/quality-checks/:id/status', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'Update quality check status',
      description: 'Update quality check status with validation',
      params: QualityCheckIdParams,
      body: UpdateQualityCheckStatusSchema,
      response: {
        200: QualityCheckResponseSchema,
        400: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: { 
      status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'SKIPPED';
      inspectorId?: string;
      inspectorName?: string;
    };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { status, inspectorId, inspectorName } = request.body;

      const updatedQualityCheck = await qcRepository.updateStatus(id, status, inspectorId, inspectorName);
      return reply.code(200).send(updatedQualityCheck);
    } catch (error: any) {
      fastify.log.error(error);
      
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          error: 'Not Found',
          message: error.message
        });
      }
      
      if (error.message.includes('Invalid status transition')) {
        return reply.code(400).send({
          error: 'Invalid Transition',
          message: error.message
        });
      }
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update quality check status'
      });
    }
  });

  // PUT /quality-checks/:id/results - Record inspection results
  fastify.put('/quality-checks/:id/results', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'Record inspection results',
      description: 'Record the results of a quality inspection',
      params: QualityCheckIdParams,
      body: RecordResultsSchema,
      response: {
        200: QualityCheckResponseSchema,
        400: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: { 
      result: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'NOT_APPLICABLE';
      measuredValue?: number;
      notes?: string;
      inspectorId?: string;
      inspectorName?: string;
    };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { result, measuredValue, notes, inspectorId, inspectorName } = request.body;

      const updatedQualityCheck = await qcRepository.recordResults(
        id, result, measuredValue, notes, inspectorId, inspectorName
      );
      return reply.code(200).send(updatedQualityCheck);
    } catch (error: any) {
      fastify.log.error(error);
      
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          error: 'Not Found',
          message: error.message
        });
      }
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to record inspection results'
      });
    }
  });

  // DELETE /quality-checks/:id - Delete quality check
  fastify.delete('/quality-checks/:id', {
    schema: {
      tags: ['Quality Checks'],
      summary: 'Delete quality check',
      description: 'Delete a quality check',
      params: QualityCheckIdParams,
      response: {
        204: Type.Null(),
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { id: string };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const deleted = await qcRepository.delete(id);
      
      if (!deleted) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Quality check with ID '${id}' not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to delete quality check'
      });
    }
  });
}
