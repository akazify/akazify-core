import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { ManufacturingOrderRepository } from '../repositories/manufacturingOrder.repository';
import { ManufacturingOrderOperationRepository } from '../repositories/manufacturingOrderOperation.repository';
import { ManufacturingOrderSchema } from '@akazify/core-domain';
import { z } from 'zod';

// Request/Response schemas using TypeBox for Fastify
const ManufacturingOrderResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  orderNumber: Type.String({ maxLength: 50 }),
  productId: Type.String({ format: 'uuid' }),
  quantity: Type.Number({ minimum: 0 }),
  uom: Type.String({ maxLength: 20 }),
  bomId: Type.Optional(Type.String({ format: 'uuid' })),
  routingId: Type.Optional(Type.String({ format: 'uuid' })),
  plannedStartDate: Type.String({ format: 'date-time' }),
  plannedEndDate: Type.String({ format: 'date-time' }),
  actualStartDate: Type.Optional(Type.String({ format: 'date-time' })),
  actualEndDate: Type.Optional(Type.String({ format: 'date-time' })),
  status: Type.Union([
    Type.Literal('PLANNED'),
    Type.Literal('RELEASED'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('COMPLETED'),
    Type.Literal('CANCELLED')
  ]),
  priority: Type.Integer({ minimum: 1, maximum: 10 }),
  notes: Type.Optional(Type.String()),
  isActive: Type.Boolean({ default: true }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  version: Type.Integer({ minimum: 1 }),
});

const ManufacturingOrderWithProductSchema = Type.Intersect([
  ManufacturingOrderResponseSchema,
  Type.Object({
    productName: Type.Optional(Type.String()),
  })
]);

const CreateManufacturingOrderSchema = Type.Object({
  productId: Type.String({ format: 'uuid' }),
  quantity: Type.Number({ minimum: 0.01 }),
  uom: Type.String({ minLength: 1, maxLength: 20 }),
  bomId: Type.Optional(Type.String({ format: 'uuid' })),
  routingId: Type.Optional(Type.String({ format: 'uuid' })),
  plannedStartDate: Type.String({ format: 'date-time' }),
  plannedEndDate: Type.String({ format: 'date-time' }),
  priority: Type.Optional(Type.Integer({ minimum: 1, maximum: 10, default: 5 })),
  notes: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean({ default: true })),
});

const UpdateManufacturingOrderSchema = Type.Partial(
  Type.Omit(CreateManufacturingOrderSchema, ['productId'])
);

const StatusUpdateSchema = Type.Object({
  status: Type.Union([
    Type.Literal('PLANNED'),
    Type.Literal('RELEASED'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('COMPLETED'),
    Type.Literal('CANCELLED')
  ]),
});

const ManufacturingOrderIdParams = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  sortBy: Type.Optional(Type.String({ default: 'planned_start_date' })),
  sortOrder: Type.Optional(Type.Union([Type.Literal('ASC'), Type.Literal('DESC')], { default: 'DESC' })),
  status: Type.Optional(Type.Union([
    Type.Literal('PLANNED'),
    Type.Literal('RELEASED'),
    Type.Literal('IN_PROGRESS'),
    Type.Literal('COMPLETED'),
    Type.Literal('CANCELLED')
  ])),
  productId: Type.Optional(Type.String({ format: 'uuid' })),
  priority: Type.Optional(Type.Integer({ minimum: 1, maximum: 10 })),
});

const PaginatedManufacturingOrderResponseSchema = Type.Object({
  data: Type.Array(ManufacturingOrderWithProductSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean(),
  }),
});

const ManufacturingOrderStatisticsSchema = Type.Object({
  total: Type.Integer(),
  byStatus: Type.Array(Type.Object({
    status: Type.String(),
    count: Type.Integer(),
  })),
  overdue: Type.Integer(),
  avgLeadTime: Type.Number(),
});

/**
 * Manufacturing Orders API routes
 */
export default async function manufacturingOrdersRoutes(fastify: FastifyInstance) {
  const moRepository = new ManufacturingOrderRepository(fastify.pg.pool);
  const moOpRepository = new ManufacturingOrderOperationRepository(fastify.pg.pool);

  // GET /manufacturing-orders - List manufacturing orders with filtering
  fastify.get('/manufacturing-orders', {
    schema: {
      tags: ['Manufacturing Orders'],
      summary: 'List manufacturing orders',
      description: 'Retrieve a paginated list of manufacturing orders with optional filtering',
      querystring: PaginationQuerySchema,
      response: {
        200: PaginatedManufacturingOrderResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      status?: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      productId?: string;
      priority?: number;
    };
  }>, reply: FastifyReply) => {
    try {
      const { page, limit, sortBy, sortOrder, status, productId, priority } = request.query;
      
      const result = await moRepository.findWithFilters(
        { page, limit, sortBy, sortOrder },
        { status, productId, priority }
      );
      
      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve manufacturing orders'
      });
    }
  });

  // GET /manufacturing-orders/statistics - Get MO statistics
  fastify.get('/manufacturing-orders/statistics', {
    schema: {
      tags: ['Manufacturing Orders'],
      summary: 'Get manufacturing order statistics',
      description: 'Retrieve statistics about manufacturing orders',
      response: {
        200: ManufacturingOrderStatisticsSchema,
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await moRepository.getStatistics();
      return reply.code(200).send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve statistics'
      });
    }
  });

  // GET /manufacturing-orders/:id - Get specific manufacturing order
  fastify.get('/manufacturing-orders/:id', {
    schema: {
      tags: ['Manufacturing Orders'],
      summary: 'Get manufacturing order by ID',
      description: 'Retrieve a specific manufacturing order',
      params: ManufacturingOrderIdParams,
      response: {
        200: ManufacturingOrderResponseSchema,
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
      const mo = await moRepository.findById(id);
      
      if (!mo) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Manufacturing order with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(mo);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve manufacturing order'
      });
    }
  });

  // POST /manufacturing-orders - Create new manufacturing order
  fastify.post('/manufacturing-orders', {
    schema: {
      tags: ['Manufacturing Orders'],
      summary: 'Create manufacturing order',
      description: 'Create a new manufacturing order with auto-generated order number',
      body: CreateManufacturingOrderSchema,
      response: {
        201: ManufacturingOrderResponseSchema,
        400: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Body: {
      productId: string;
      quantity: number;
      uom: string;
      bomId?: string;
      routingId?: string;
      plannedStartDate: string;
      plannedEndDate: string;
      priority?: number;
      notes?: string;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const moData = request.body;

      // Validate against domain schema
      const validatedData = ManufacturingOrderSchema.omit({
        id: true,
        orderNumber: true,
        createdAt: true,
        updatedAt: true,
        version: true
      }).parse({
        ...moData,
        plannedStartDate: new Date(moData.plannedStartDate),
        plannedEndDate: new Date(moData.plannedEndDate),
        priority: moData.priority || 5,
        isActive: moData.isActive ?? true,
        status: 'PLANNED' as const,
      });

      const newMO = await moRepository.createWithOrderNumber(validatedData);
      
      return reply.code(201).send(newMO);
    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create manufacturing order'
      });
    }
  });

  // PUT /manufacturing-orders/:id - Update manufacturing order
  fastify.put('/manufacturing-orders/:id', {
    schema: {
      tags: ['Manufacturing Orders'],
      summary: 'Update manufacturing order',
      description: 'Update an existing manufacturing order',
      params: ManufacturingOrderIdParams,
      body: UpdateManufacturingOrderSchema,
      response: {
        200: ManufacturingOrderResponseSchema,
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
      quantity?: number;
      uom?: string;
      bomId?: string;
      routingId?: string;
      plannedStartDate?: string;
      plannedEndDate?: string;
      priority?: number;
      notes?: string;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      // Convert date strings to Date objects
      const processedData = {
        ...updateData,
        ...(updateData.plannedStartDate && { plannedStartDate: new Date(updateData.plannedStartDate) }),
        ...(updateData.plannedEndDate && { plannedEndDate: new Date(updateData.plannedEndDate) }),
      };

      const updatedMO = await moRepository.update(id, processedData);
      
      if (!updatedMO) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Manufacturing order with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(updatedMO);
    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update manufacturing order'
      });
    }
  });

  // PUT /manufacturing-orders/:id/status - Update MO status with lifecycle validation
  fastify.put('/manufacturing-orders/:id/status', {
    schema: {
      tags: ['Manufacturing Orders'],
      summary: 'Update manufacturing order status',
      description: 'Update MO status with automatic lifecycle validation',
      params: ManufacturingOrderIdParams,
      body: StatusUpdateSchema,
      response: {
        200: ManufacturingOrderResponseSchema,
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
    Body: { status: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      // Validate that all operations are completed before marking order as COMPLETED
      if (status === 'COMPLETED') {
        const operations = await moOpRepository.getByManufacturingOrder(id);
        
        if (operations.length > 0) {
          const allCompleted = operations.every(op => op.status === 'COMPLETED');
          
          if (!allCompleted) {
            const incompleteCount = operations.filter(op => op.status !== 'COMPLETED').length;
            return reply.code(400).send({
              error: 'Validation Error',
              message: `Cannot complete manufacturing order - ${incompleteCount} operation(s) are not completed. All operations must be completed before the order can be marked as COMPLETED.`
            });
          }
        }
      }

      const updatedMO = await moRepository.updateStatus(id, status);
      
      return reply.code(200).send(updatedMO);
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
        message: 'Failed to update manufacturing order status'
      });
    }
  });

  // DELETE /manufacturing-orders/:id - Delete manufacturing order
  fastify.delete('/manufacturing-orders/:id', {
    schema: {
      tags: ['Manufacturing Orders'],
      summary: 'Delete manufacturing order',
      description: 'Delete a manufacturing order (soft delete)',
      params: ManufacturingOrderIdParams,
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
      const deleted = await moRepository.delete(id);
      
      if (!deleted) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Manufacturing order with ID '${id}' not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to delete manufacturing order'
      });
    }
  });
}
