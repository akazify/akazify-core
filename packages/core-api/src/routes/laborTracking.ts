import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { LaborTrackingRepository } from '../repositories/laborTracking.repository';

const laborTrackingRoutes: FastifyPluginAsync = async (fastify) => {
  const laborRepo = new LaborTrackingRepository(fastify.pg.pool);

  // Get labor assignments for operation
  fastify.get('/operations/:operationId/labor', {
    schema: {
      params: Type.Object({
        operationId: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Array(Type.Object({
          id: Type.String(),
          operatorName: Type.String(),
          role: Type.String(),
          status: Type.String(),
          clockInTime: Type.Optional(Type.String()),
          actualHours: Type.Number(),
          hourlyRate: Type.Optional(Type.Number()),
        }))
      }
    }
  }, async (request, reply) => {
    try {
      const { operationId } = request.params as { operationId: string };
      const assignments = await laborRepo.findByOperationId(operationId);
      return assignments;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch labor assignments' });
    }
  });

  // Clock in operator
  fastify.post('/labor/:assignmentId/clock-in', {
    schema: {
      params: Type.Object({
        assignmentId: Type.String({ format: 'uuid' })
      })
    }
  }, async (request, reply) => {
    try {
      const { assignmentId } = request.params as { assignmentId: string };
      const assignment = await laborRepo.clockIn(assignmentId);
      
      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }
      
      return assignment;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to clock in' });
    }
  });

  // Clock out operator
  fastify.post('/labor/:assignmentId/clock-out', {
    schema: {
      params: Type.Object({
        assignmentId: Type.String({ format: 'uuid' })
      })
    }
  }, async (request, reply) => {
    try {
      const { assignmentId } = request.params as { assignmentId: string };
      const assignment = await laborRepo.clockOut(assignmentId);
      
      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }
      
      return assignment;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to clock out' });
    }
  });

  // Start break
  fastify.post('/labor/:assignmentId/break/start', {
    schema: {
      params: Type.Object({
        assignmentId: Type.String({ format: 'uuid' })
      })
    }
  }, async (request, reply) => {
    try {
      const { assignmentId } = request.params as { assignmentId: string };
      const assignment = await laborRepo.startBreak(assignmentId);
      
      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }
      
      return assignment;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to start break' });
    }
  });

  // End break
  fastify.post('/labor/:assignmentId/break/end', {
    schema: {
      params: Type.Object({
        assignmentId: Type.String({ format: 'uuid' })
      })
    }
  }, async (request, reply) => {
    try {
      const { assignmentId } = request.params as { assignmentId: string };
      const assignment = await laborRepo.endBreak(assignmentId);
      
      if (!assignment) {
        return reply.status(404).send({ error: 'Assignment not found' });
      }
      
      return assignment;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to end break' });
    }
  });

  // Get labor summary
  fastify.get('/operations/:operationId/labor/summary', {
    schema: {
      params: Type.Object({
        operationId: Type.String({ format: 'uuid' })
      })
    }
  }, async (request, reply) => {
    try {
      const { operationId } = request.params as { operationId: string };
      const summary = await laborRepo.getLaborSummary(operationId);
      return summary;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch labor summary' });
    }
  });
};

export default laborTrackingRoutes;
