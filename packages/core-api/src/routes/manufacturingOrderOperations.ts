import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { ManufacturingOrderOperationRepository } from '../repositories/manufacturingOrderOperation.repository';
import { ManufacturingOrderOperationSchema } from '@akazify/core-domain';
import { z } from 'zod';

// Request/Response schemas using TypeBox for Fastify
const MOOperationResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  manufacturingOrderId: Type.String({ format: 'uuid' }),
  workCenterId: Type.String({ format: 'uuid' }),
  operationId: Type.String({ maxLength: 50 }),
  sequence: Type.Integer({ minimum: 1 }),
  plannedQuantity: Type.Number({ minimum: 0 }),
  completedQuantity: Type.Number({ minimum: 0 }),
  status: Type.Union([
    Type.Literal('WAITING'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('COMPLETED'),
    Type.Literal('BLOCKED')
  ]),
  plannedStartTime: Type.Optional(Type.String({ format: 'date-time' })),
  actualStartTime: Type.Optional(Type.String({ format: 'date-time' })),
  plannedEndTime: Type.Optional(Type.String({ format: 'date-time' })),
  actualEndTime: Type.Optional(Type.String({ format: 'date-time' })),
  isActive: Type.Boolean({ default: true }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  version: Type.Integer({ minimum: 1 }),
});

const MOOperationWithDetailsSchema = Type.Intersect([
  MOOperationResponseSchema,
  Type.Object({
    workCenterName: Type.Optional(Type.String()),
    workCenterCode: Type.Optional(Type.String()),
    manufacturingOrderNumber: Type.Optional(Type.String()),
  })
]);

const CreateMOOperationSchema = Type.Object({
  manufacturingOrderId: Type.String({ format: 'uuid' }),
  workCenterId: Type.String({ format: 'uuid' }),
  operationId: Type.String({ minLength: 1, maxLength: 50 }),
  sequence: Type.Integer({ minimum: 1 }),
  plannedQuantity: Type.Number({ minimum: 0.01 }),
  plannedStartTime: Type.Optional(Type.String({ format: 'date-time' })),
  plannedEndTime: Type.Optional(Type.String({ format: 'date-time' })),
});

const UpdateMOOperationSchema = Type.Partial(
  Type.Omit(CreateMOOperationSchema, ['manufacturingOrderId'])
);

const StatusUpdateSchema = Type.Object({
  status: Type.Union([
    Type.Literal('WAITING'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('COMPLETED'),
    Type.Literal('BLOCKED')
  ]),
});

const QuantityUpdateSchema = Type.Object({
  completedQuantity: Type.Number({ minimum: 0 }),
});

const MOOperationIdParams = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

const MOIdParams = Type.Object({
  moId: Type.String({ format: 'uuid' }),
});

const OperationProgressSchema = Type.Object({
  totalOperations: Type.Integer(),
  completedOperations: Type.Integer(),
  inProgressOperations: Type.Integer(),
  waitingOperations: Type.Integer(),
  blockedOperations: Type.Integer(),
  overallProgress: Type.Number(),
  currentOperation: Type.Optional(MOOperationWithDetailsSchema),
});

const CreateOperationsFromRoutingSchema = Type.Object({
  operations: Type.Array(Type.Object({
    workCenterId: Type.String({ format: 'uuid' }),
    operationId: Type.String({ minLength: 1, maxLength: 50 }),
    sequence: Type.Integer({ minimum: 1 }),
    plannedQuantity: Type.Number({ minimum: 0.01 }),
    plannedStartTime: Type.Optional(Type.String({ format: 'date-time' })),
    plannedEndTime: Type.Optional(Type.String({ format: 'date-time' })),
  }))
});

const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  sortBy: Type.Optional(Type.String({ default: 'sequence' })),
  sortOrder: Type.Optional(Type.Union([Type.Literal('ASC'), Type.Literal('DESC')], { default: 'ASC' })),
  manufacturingOrderId: Type.Optional(Type.String({ format: 'uuid' })),
  workCenterId: Type.Optional(Type.String({ format: 'uuid' })),
  status: Type.Optional(Type.Union([
    Type.Literal('WAITING'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('COMPLETED'),
    Type.Literal('BLOCKED')
  ])),
});

const PaginatedMOOperationResponseSchema = Type.Object({
  data: Type.Array(MOOperationWithDetailsSchema),
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
 * Manufacturing Order Operations API routes
 */
export default async function manufacturingOrderOperationsRoutes(fastify: FastifyInstance) {
  const moOpRepository = new ManufacturingOrderOperationRepository(fastify.pg.pool);

  // GET /manufacturing-orders/:moId/operations - List operations for a manufacturing order
  fastify.get('/manufacturing-orders/:moId/operations', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'List operations for manufacturing order',
      description: 'Retrieve operations for a specific manufacturing order',
      params: MOIdParams,
      response: {
        200: Type.Array(MOOperationResponseSchema),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { moId: string };
  }>, reply: FastifyReply) => {
    try {
      const { moId } = request.params;
      const operations = await moOpRepository.findByManufacturingOrderId(moId);
      return reply.code(200).send(operations);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve operations'
      });
    }
  });

  // GET /manufacturing-orders/:moId/operations/progress - Get operation progress
  fastify.get('/manufacturing-orders/:moId/operations/progress', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Get operation progress',
      description: 'Retrieve progress statistics for manufacturing order operations',
      params: MOIdParams,
      response: {
        200: OperationProgressSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Params: { moId: string };
  }>, reply: FastifyReply) => {
    try {
      const { moId } = request.params;
      const progress = await moOpRepository.getOperationProgress(moId);
      return reply.code(200).send(progress);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve progress'
      });
    }
  });

  // POST /manufacturing-orders/:moId/operations/from-routing - Create operations from routing
  fastify.post('/manufacturing-orders/:moId/operations/from-routing', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Create operations from routing',
      description: 'Create multiple operations for a manufacturing order based on routing',
      params: MOIdParams,
      body: CreateOperationsFromRoutingSchema,
      response: {
        201: Type.Array(MOOperationResponseSchema),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { moId: string };
    Body: { operations: any[] };
  }>, reply: FastifyReply) => {
    try {
      const { moId } = request.params;
      const { operations } = request.body;

      // Process operations data
      const processedOperations = operations.map(op => ({
        ...op,
        plannedStartTime: op.plannedStartTime ? new Date(op.plannedStartTime) : undefined,
        plannedEndTime: op.plannedEndTime ? new Date(op.plannedEndTime) : undefined,
      }));

      const createdOperations = await moOpRepository.createOperationsFromRouting(moId, processedOperations);
      return reply.code(201).send(createdOperations);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create operations'
      });
    }
  });

  // GET /mo-operations - List all operations with filtering
  fastify.get('/mo-operations', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'List manufacturing order operations',
      description: 'Retrieve a paginated list of operations with optional filtering',
      querystring: PaginationQuerySchema,
      response: {
        200: PaginatedMOOperationResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      manufacturingOrderId?: string;
      workCenterId?: string;
      status?: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    };
  }>, reply: FastifyReply) => {
    try {
      const { page, limit, sortBy, sortOrder, manufacturingOrderId, workCenterId, status } = request.query;
      
      const result = await moOpRepository.findWithWorkCenterDetails(
        { page, limit, sortBy, sortOrder },
        { manufacturingOrderId, workCenterId, status }
      );
      
      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve operations'
      });
    }
  });

  // GET /mo-operations/:id - Get specific operation
  fastify.get('/mo-operations/:id', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Get operation by ID',
      description: 'Retrieve a specific manufacturing order operation',
      params: MOOperationIdParams,
      response: {
        200: MOOperationResponseSchema,
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
      const operation = await moOpRepository.findById(id);
      
      if (!operation) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Operation with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(operation);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve operation'
      });
    }
  });

  // POST /mo-operations - Create new operation
  fastify.post('/mo-operations', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Create operation',
      description: 'Create a new manufacturing order operation',
      body: CreateMOOperationSchema,
      response: {
        201: MOOperationResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Body: {
      manufacturingOrderId: string;
      workCenterId: string;
      operationId: string;
      sequence: number;
      plannedQuantity: number;
      plannedStartTime?: string;
      plannedEndTime?: string;
    };
  }>, reply: FastifyReply) => {
    try {
      const opData = request.body;

      // Validate and process data
      const validatedData = {
        ...opData,
        plannedStartTime: opData.plannedStartTime ? new Date(opData.plannedStartTime) : undefined,
        plannedEndTime: opData.plannedEndTime ? new Date(opData.plannedEndTime) : undefined,
        status: 'WAITING' as const,
        completedQuantity: 0,
        isActive: true,
      };

      const newOperation = await moOpRepository.create(validatedData);
      return reply.code(201).send(newOperation);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create operation'
      });
    }
  });

  // PUT /mo-operations/:id/status - Update operation status
  fastify.put('/mo-operations/:id/status', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Update operation status',
      description: 'Update operation status with lifecycle validation',
      params: MOOperationIdParams,
      body: StatusUpdateSchema,
      response: {
        200: MOOperationResponseSchema,
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
    Body: { status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      const updatedOperation = await moOpRepository.updateStatus(id, status);
      return reply.code(200).send(updatedOperation);
    } catch (error) {
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
        message: 'Failed to update operation status'
      });
    }
  });

  // PUT /mo-operations/:id/quantity - Update operation quantity
  fastify.put('/mo-operations/:id/quantity', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Update operation quantity',
      description: 'Update completed quantity for an operation',
      params: MOOperationIdParams,
      body: QuantityUpdateSchema,
      response: {
        200: MOOperationResponseSchema,
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
    Body: { completedQuantity: number };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { completedQuantity } = request.body;

      const updatedOperation = await moOpRepository.updateQuantity(id, completedQuantity);
      return reply.code(200).send(updatedOperation);
    } catch (error) {
      fastify.log.error(error);
      
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          error: 'Not Found',
          message: error.message
        });
      }
      
      if (error.message.includes('must be between')) {
        return reply.code(400).send({
          error: 'Invalid Quantity',
          message: error.message
        });
      }
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update quantity'
      });
    }
  });

  // PUT /mo-operations/:id - Update operation
  fastify.put('/mo-operations/:id', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Update operation',
      description: 'Update an existing manufacturing order operation',
      params: MOOperationIdParams,
      body: UpdateMOOperationSchema,
      response: {
        200: MOOperationResponseSchema,
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      workCenterId?: string;
      operationId?: string;
      sequence?: number;
      plannedQuantity?: number;
      plannedStartTime?: string;
      plannedEndTime?: string;
    };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      // Process date strings
      const processedData = {
        ...updateData,
        ...(updateData.plannedStartTime && { plannedStartTime: new Date(updateData.plannedStartTime) }),
        ...(updateData.plannedEndTime && { plannedEndTime: new Date(updateData.plannedEndTime) }),
      };

      const updatedOperation = await moOpRepository.update(id, processedData);
      
      if (!updatedOperation) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Operation with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(updatedOperation);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update operation'
      });
    }
  });

  // DELETE /mo-operations/:id - Delete operation
  fastify.delete('/mo-operations/:id', {
    schema: {
      tags: ['Manufacturing Order Operations'],
      summary: 'Delete operation',
      description: 'Delete a manufacturing order operation',
      params: MOOperationIdParams,
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
      const deleted = await moOpRepository.delete(id);
      
      if (!deleted) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Operation with ID '${id}' not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to delete operation'
      });
    }
  });
}
