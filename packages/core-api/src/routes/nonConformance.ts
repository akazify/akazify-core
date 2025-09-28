import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

const nonConformanceRoutes: FastifyPluginAsync = async (fastify) => {
  // Get NCRs
  fastify.get('/operations/:operationId/ncrs', async (request, reply) => {
    const mockNCRs = [
      { id: '1', ncrNumber: 'NCR-2025-001', title: 'Dimensional variance', severity: 'MAJOR', status: 'INVESTIGATING' }
    ];
    return mockNCRs;
  });

  // Create NCR
  fastify.post('/ncrs', async (request, reply) => {
    const newNCR = { id: 'new-ncr', ncrNumber: 'NCR-2025-NEW', status: 'OPEN' };
    return reply.status(201).send(newNCR);
  });
};

export default nonConformanceRoutes;
