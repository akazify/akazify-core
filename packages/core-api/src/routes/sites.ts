import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { SiteRepository } from '../repositories/site.repository';
import { AreaRepository } from '../repositories/area.repository';
import { SiteSchema, AreaSchema } from '@akazify/core-domain';
import { z } from 'zod';

// Request/Response schemas using TypeBox for Fastify
const SiteResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 100 }),
  code: Type.String({ maxLength: 20 }),
  description: Type.Optional(Type.String()),
  address: Type.Optional(Type.String()),
  region: Type.Optional(Type.String()),
  timezone: Type.String({ default: 'UTC' }),
  isActive: Type.Boolean({ default: true }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  version: Type.Integer({ minimum: 1 }),
});

const CreateSiteSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  code: Type.String({ minLength: 1, maxLength: 20 }),
  description: Type.Optional(Type.String()),
  address: Type.Optional(Type.String()),
  region: Type.Optional(Type.String()),
  timezone: Type.Optional(Type.String({ default: 'UTC' })),
  isActive: Type.Optional(Type.Boolean({ default: true })),
});

const UpdateSiteSchema = Type.Partial(CreateSiteSchema);

const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  sortBy: Type.Optional(Type.String({ default: 'created_at' })),
  sortOrder: Type.Optional(Type.Union([Type.Literal('ASC'), Type.Literal('DESC')], { default: 'DESC' })),
  region: Type.Optional(Type.String()),
  timezone: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
});

const SiteIdParams = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

// Area schemas for nested routes
const AreaResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  siteId: Type.String({ format: 'uuid' }),
  name: Type.String({ maxLength: 100 }),
  code: Type.String({ maxLength: 20 }),
  description: Type.Optional(Type.String()),
  parentAreaId: Type.Optional(Type.String({ format: 'uuid' })),
  level: Type.Integer({ minimum: 1, maximum: 5 }),
  isActive: Type.Boolean({ default: true }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  version: Type.Integer({ minimum: 1 }),
});

const CreateAreaSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  code: Type.String({ minLength: 1, maxLength: 20 }),
  description: Type.Optional(Type.String()),
  parentAreaId: Type.Optional(Type.String({ format: 'uuid' })),
  level: Type.Integer({ minimum: 1, maximum: 5, default: 1 }),
  isActive: Type.Optional(Type.Boolean({ default: true })),
});

const UpdateAreaSchema = Type.Partial(CreateAreaSchema);

const AreaIdParams = Type.Object({
  siteId: Type.String({ format: 'uuid' }),
  areaId: Type.String({ format: 'uuid' }),
});

const PaginatedAreaResponseSchema = Type.Object({
  data: Type.Array(AreaResponseSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean(),
  }),
});

const PaginatedSiteResponseSchema = Type.Object({
  data: Type.Array(SiteResponseSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean(),
  }),
});

const SiteStatisticsSchema = Type.Object({
  total: Type.Integer(),
  active: Type.Integer(),
  byRegion: Type.Array(Type.Object({
    region: Type.String(),
    count: Type.Integer(),
  })),
  byTimezone: Type.Array(Type.Object({
    timezone: Type.String(),
    count: Type.Integer(),
  })),
});

/**
 * Sites API routes
 */
export default async function sitesRoutes(fastify: FastifyInstance) {
  const siteRepository = new SiteRepository(fastify.pg.pool);
  const areaRepository = new AreaRepository(fastify.pg.pool);

  // GET /sites - List sites with pagination and filtering
  fastify.get('/sites', {
    schema: {
      tags: ['Sites'],
      summary: 'List sites',
      description: 'Retrieve a paginated list of manufacturing sites with optional filtering',
      querystring: PaginationQuerySchema,
      response: {
        200: PaginatedSiteResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      region?: string;
      timezone?: string;
      code?: string;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = request.query;
      
      const paginationOptions = {
        page: page || 1,
        limit: limit || 50,
        sortBy: sortBy || 'created_at',
        sortOrder: sortOrder || 'DESC' as const,
      };

      const result = await siteRepository.findAll(paginationOptions, filters);
      
      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve sites'
      });
    }
  });

  // GET /sites/statistics - Get site statistics
  fastify.get('/sites/statistics', {
    schema: {
      tags: ['Sites'],
      summary: 'Get site statistics',
      description: 'Retrieve aggregated statistics about manufacturing sites',
      response: {
        200: SiteStatisticsSchema,
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const statistics = await siteRepository.getStatistics();
      return reply.code(200).send(statistics);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve site statistics'
      });
    }
  });

  // GET /sites/:id - Get site by ID
  fastify.get('/sites/:id', {
    schema: {
      tags: ['Sites'],
      summary: 'Get site by ID',
      description: 'Retrieve a specific manufacturing site by its ID',
      params: SiteIdParams,
      response: {
        200: SiteResponseSchema,
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
      const site = await siteRepository.findById(id);
      
      if (!site) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Site with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(site);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to retrieve site'
      });
    }
  });

  // POST /sites - Create new site
  fastify.post('/sites', {
    schema: {
      tags: ['Sites'],
      summary: 'Create site',
      description: 'Create a new manufacturing site',
      body: CreateSiteSchema,
      response: {
        201: SiteResponseSchema,
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
      name: string;
      code: string;
      description?: string;
      address?: string;
      region?: string;
      timezone?: string;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const siteData = request.body;
      
      // Validate against domain schema
      const validatedData = SiteSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        version: true
      }).parse({
        ...siteData,
        timezone: siteData.timezone || 'UTC',
        isActive: siteData.isActive ?? true,
      });

      const newSite = await siteRepository.create(validatedData);
      
      return reply.code(201).send(newSite);
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
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create site'
      });
    }
  });

  // PUT /sites/:id - Update site
  fastify.put('/sites/:id', {
    schema: {
      tags: ['Sites'],
      summary: 'Update site',
      description: 'Update an existing manufacturing site',
      params: SiteIdParams,
      body: UpdateSiteSchema,
      response: {
        200: SiteResponseSchema,
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
      name?: string;
      code?: string;
      description?: string;
      address?: string;
      region?: string;
      timezone?: string;
      isActive?: boolean;
    };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      
      const updatedSite = await siteRepository.update(id, updateData);
      
      if (!updatedSite) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Site with ID '${id}' not found`
        });
      }
      
      return reply.code(200).send(updatedSite);
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
      
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update site'
      });
    }
  });

  // DELETE /sites/:id - Delete site
  fastify.delete('/sites/:id', {
    schema: {
      tags: ['Sites'],
      summary: 'Delete site',
      description: 'Soft delete a manufacturing site (sets isActive to false)',
      params: SiteIdParams,
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
      
      // Check if site can be deleted
      const canDelete = await siteRepository.canDelete(id);
      if (!canDelete) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cannot delete site that has active areas'
        });
      }
      
      const deleted = await siteRepository.delete(id);
      
      if (!deleted) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Site with ID '${id}' not found`
        });
      }
      
      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to delete site'
      });
    }
  });

  // GET /sites/:siteId/areas - List areas in site
  fastify.get('/sites/:siteId/areas', {
    schema: {
      tags: ['Sites', 'Areas'],
      params: Type.Object({ siteId: Type.String({ format: 'uuid' }) }),
      response: { 200: PaginatedAreaResponseSchema },
    },
  }, async (request: FastifyRequest<{ Params: { siteId: string } }>, reply: FastifyReply) => {
    try {
      const { siteId } = request.params;
      const result = await areaRepository.findBySite(siteId);
      return reply.code(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to retrieve areas' });
    }
  });

  // POST /sites/:siteId/areas - Create area in site  
  fastify.post('/sites/:siteId/areas', {
    schema: {
      tags: ['Sites', 'Areas'],
      params: Type.Object({ siteId: Type.String({ format: 'uuid' }) }),
      body: CreateAreaSchema,
      response: { 201: AreaResponseSchema },
    },
  }, async (request: FastifyRequest<{ Params: { siteId: string }; Body: any }>, reply: FastifyReply) => {
    try {
      const { siteId } = request.params;
      const areaData = request.body;
      const newArea = await areaRepository.createInSite(siteId, areaData);
      return reply.code(201).send(newArea);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to create area' });
    }
  });

  // PUT /sites/:siteId/areas/:areaId - Update area
  fastify.put('/sites/:siteId/areas/:areaId', {
    schema: {
      tags: ['Sites', 'Areas'],
      params: AreaIdParams,
      body: UpdateAreaSchema,
      response: { 200: AreaResponseSchema },
    },
  }, async (request: FastifyRequest<{ Params: { siteId: string; areaId: string }; Body: any }>, reply: FastifyReply) => {
    try {
      const { siteId, areaId } = request.params;
      const updateData = request.body;
      
      // Verify area belongs to this site
      const existingArea = await areaRepository.findById(areaId);
      if (!existingArea || existingArea.siteId !== siteId) {
        return reply.code(404).send({ error: 'Not Found', message: 'Area not found in this site' });
      }
      
      const updatedArea = await areaRepository.update(areaId, updateData);
      return reply.code(200).send(updatedArea);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to update area' });
    }
  });

  // DELETE /sites/:siteId/areas/:areaId - Delete area
  fastify.delete('/sites/:siteId/areas/:areaId', {
    schema: {
      tags: ['Sites', 'Areas'],
      params: AreaIdParams,
      response: { 204: Type.Null() },
    },
  }, async (request: FastifyRequest<{ Params: { siteId: string; areaId: string } }>, reply: FastifyReply) => {
    try {
      const { siteId, areaId } = request.params;
      
      // Verify area belongs to this site and can be deleted
      const existingArea = await areaRepository.findById(areaId);
      if (!existingArea || existingArea.siteId !== siteId) {
        return reply.code(404).send({ error: 'Not Found', message: 'Area not found in this site' });
      }
      
      const canDelete = await areaRepository.canDelete(areaId);
      if (!canDelete) {
        return reply.code(400).send({ error: 'Bad Request', message: 'Cannot delete area with active work centers or child areas' });
      }
      
      await areaRepository.delete(areaId);
      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to delete area' });
    }
  });
}
