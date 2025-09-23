import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { WorkCenterRepository } from '../repositories/workCenter.repository';
import { WorkCenterSchema } from '@akazify/core-domain';
import { z } from 'zod';

// Request/Response schemas using TypeBox for Fastify
const WorkCenterResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  areaId: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 100 }),
  code: Type.String({ maxLength: 20 }),
  description: Type.Optional(Type.String()),
  category: Type.Union([
    Type.Literal('PRODUCTION'),
    Type.Literal('ASSEMBLY'),
    Type.Literal('PACKAGING'),
    Type.Literal('QUALITY'),
    Type.Literal('MAINTENANCE')
  ]),
  capacity: Type.Optional(Type.Number({ minimum: 0 })),
  isActive: Type.Boolean({ default: true }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  version: Type.Integer({ minimum: 1 }),
});

const WorkCenterWithAreaResponseSchema = Type.Intersect([
  WorkCenterResponseSchema,
  Type.Object({
    area: Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
      code: Type.String(),
      siteId: Type.String({ format: 'uuid' }),
    }),
  })
]);

const CreateWorkCenterSchema = Type.Object({
  areaId: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  code: Type.String({ minLength: 1, maxLength: 20 }),
  description: Type.Optional(Type.String()),
  category: Type.Union([
    Type.Literal('PRODUCTION'),
    Type.Literal('ASSEMBLY'),
    Type.Literal('PACKAGING'),
    Type.Literal('QUALITY'),
    Type.Literal('MAINTENANCE')
  ]),
  capacity: Type.Optional(Type.Number({ minimum: 0 })),
  isActive: Type.Optional(Type.Boolean({ default: true })),
});

const UpdateWorkCenterSchema = Type.Partial(CreateWorkCenterSchema);

const WorkCenterQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  sortBy: Type.Optional(Type.String({ default: 'wc.created_at' })),
  sortOrder: Type.Optional(Type.Union([Type.Literal('ASC'), Type.Literal('DESC')], { default: 'DESC' })),
  areaId: Type.Optional(Type.String({ format: 'uuid' })),
  siteId: Type.Optional(Type.String({ format: 'uuid' })),
  category: Type.Optional(Type.Union([
    Type.Literal('PRODUCTION'),
    Type.Literal('ASSEMBLY'),
    Type.Literal('PACKAGING'),
    Type.Literal('QUALITY'),
    Type.Literal('MAINTENANCE')
  ])),
  code: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
});

const WorkCenterIdParams = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

const PaginatedWorkCenterResponseSchema = Type.Object({
  data: Type.Array(WorkCenterWithAreaResponseSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean(),
  }),
});

const WorkCenterCapacityMetricsSchema = Type.Array(Type.Object({
  workCenterId: Type.String({ format: 'uuid' }),
  workCenterCode: Type.String(),
  capacity: Type.Optional(Type.Number()),
  utilizationPercentage: Type.Number(),
  activeOperations: Type.Integer(),
  plannedOperations: Type.Integer(),
}));

const WorkCenterStatisticsSchema = Type.Object({
  total: Type.Integer(),
  active: Type.Integer(),
  byCategory: Type.Array(Type.Object({
    category: Type.String(),
    count: Type.Integer(),
  })),
  totalCapacity: Type.Number(),
  averageCapacity: Type.Number(),
});

/**
 * Work Centers API routes
 */
export default async function workCentersRoutes(fastify: FastifyInstance) {
  const workCenterRepository = new WorkCenterRepository(fastify.pg.pool);

  // GET /work-centers - List work centers with pagination and filtering
  fastify.get('/work-centers', {
    schema: {
      tags: ['Work Centers'],
      summary: 'List work centers',
      description: 'Retrieve a paginated list of work centers with area information and optional filtering',
      querystring: WorkCenterQuerySchema,
      response: {
        200: PaginatedWorkCenterResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      areaId?: string;
      siteId?: string;
      category?: 'PRODUCTION' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY' | 'MAINTENANCE';
      code?: string;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = request.query;
      
      const paginationOptions = {
        page: page || 1,
        limit: limit || 50,
        sortBy: sortBy || 'wc.created_at',
        sortOrder: sortOrder || 'DESC' as const,
      };

      const result = await workCenterRepository.findWithArea(paginationOptions, filters);
      
      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve work centers'
      });
    }
  });

  // GET /work-centers/statistics - Get work center statistics
  fastify.get('/work-centers/statistics', {
    schema: {
      tags: ['Work Centers'],
      summary: 'Get work center statistics',
      description: 'Retrieve aggregated statistics about work centers',
      response: {
        200: WorkCenterStatisticsSchema,
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const statistics = await workCenterRepository.getStatistics();
      return reply.code(200).send(statistics);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve work center statistics'
      });
    }
  });

  // GET /work-centers/capacity-metrics - Get capacity metrics
  fastify.get('/work-centers/capacity-metrics', {
    schema: {
      tags: ['Work Centers'],
      summary: 'Get capacity metrics',
      description: 'Retrieve capacity utilization metrics for work centers',
      querystring: Type.Object({
        workCenterId: Type.Optional(Type.String({ format: 'uuid' })),
      }),
      response: {
        200: WorkCenterCapacityMetricsSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Querystring: {
      workCenterId?: string;
    };
  }>, reply: FastifyReply) => {
    try {
      const { workCenterId } = request.query;
      const metrics = await workCenterRepository.getCapacityMetrics(workCenterId);
      return reply.code(200).send(metrics);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve capacity metrics'
      });
    }
  });

  // GET /work-centers/:id - Get work center by ID
  fastify.get('/work-centers/:id', {
    schema: {
      tags: ['Work Centers'],
      summary: 'Get work center by ID',
      description: 'Retrieve a specific work center by its ID',
      params: WorkCenterIdParams,
      response: {
        200: WorkCenterResponseSchema,
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
      const workCenter = await workCenterRepository.findById(id);
      
      if (!workCenter) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Work center with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(workCenter);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve work center'
      });
    }
  });

  // POST /work-centers - Create new work center
  fastify.post('/work-centers', {
    schema: {
      tags: ['Work Centers'],
      summary: 'Create work center',
      description: 'Create a new work center within an area',
      body: CreateWorkCenterSchema,
      response: {
        201: WorkCenterResponseSchema,
        400: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
        409: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Body: {
      areaId: string;
      name: string;
      code: string;
      description?: string;
      category: 'PRODUCTION' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY' | 'MAINTENANCE';
      capacity?: number;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const workCenterData = request.body;
      
      // Validate against domain schema
      const validatedData = WorkCenterSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        version: true
      }).parse({
        ...workCenterData,
        isActive: workCenterData.isActive ?? true,
      });

      const newWorkCenter = await workCenterRepository.create(validatedData);
      
      return reply.code(201).send(newWorkCenter);
    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({
          error: 'Conflict',
          message: error.message
        });
      }

      if (error instanceof Error && error.message.includes('does not exist')) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create work center'
      });
    }
  });

  // PUT /work-centers/:id - Update work center
  fastify.put('/work-centers/:id', {
    schema: {
      tags: ['Work Centers'],
      summary: 'Update work center',
      description: 'Update an existing work center',
      params: WorkCenterIdParams,
      body: UpdateWorkCenterSchema,
      response: {
        200: WorkCenterResponseSchema,
        400: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
        404: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
        409: Type.Object({
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  }, async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      areaId?: string;
      name?: string;
      code?: string;
      description?: string;
      category?: 'PRODUCTION' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY' | 'MAINTENANCE';
      capacity?: number;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const updatedWorkCenter = await workCenterRepository.update(id, updateData);
      
      if (!updatedWorkCenter) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Work center with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(updatedWorkCenter);
    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({
          error: 'Conflict',
          message: error.message
        });
      }

      if (error instanceof Error && error.message.includes('does not exist')) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update work center'
      });
    }
  });

  // DELETE /work-centers/:id - Delete work center
  fastify.delete('/work-centers/:id', {
    schema: {
      tags: ['Work Centers'],
      summary: 'Delete work center',
      description: 'Soft delete a work center (sets isActive to false)',
      params: WorkCenterIdParams,
      response: {
        204: Type.Null(),
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
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if work center can be deleted
      const canDeleteResult = await workCenterRepository.canDelete(id);
      if (!canDeleteResult.canDelete) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: canDeleteResult.reason || 'Cannot delete work center'
        });
      }
      
      const deleted = await workCenterRepository.delete(id);
      
      if (!deleted) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Work center with ID '${id}' not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to delete work center'
      });
    }
  });
}
