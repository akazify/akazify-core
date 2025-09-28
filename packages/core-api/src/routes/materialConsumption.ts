import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { BaseRepository } from '../repositories/base';

const materialConsumptionRoutes: FastifyPluginAsync = async (fastify) => {
  const materialRepo = new BaseRepository(fastify.pg.pool, 'material_consumption');

  // Get material consumption for operation
  fastify.get('/operations/:operationId/materials', {
    schema: {
      params: Type.Object({
        operationId: Type.String({ format: 'uuid' })
      })
    }
  }, async (request, reply) => {
    try {
      const { operationId } = request.params as { operationId: string };
      
      // Mock response for now - replace with real repository call
      const materials = [
        {
          id: '1',
          sku: 'STL-BAR-100',
          productName: 'Steel Bar 100mm',
          plannedQuantity: 100,
          consumedQuantity: 75,
          wasteQuantity: 3,
          unitCost: 8.50,
          totalCost: 637.50,
          wasteCost: 25.50,
        },
        {
          id: '2',
          sku: 'OIL-CUT-5L',
          productName: 'Cutting Oil Premium',
          plannedQuantity: 5,
          consumedQuantity: 2.3,
          wasteQuantity: 0.3,
          unitCost: 12.00,
          totalCost: 27.60,
          wasteCost: 3.60,
        }
      ];
      
      return materials;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch material consumption' });
    }
  });

  // Record material consumption
  fastify.post('/materials/consume', {
    schema: {
      body: Type.Object({
        operationId: Type.String({ format: 'uuid' }),
        materialId: Type.String(),
        consumedQuantity: Type.Number({ minimum: 0 }),
        wasteQuantity: Type.Optional(Type.Number({ minimum: 0 })),
        notes: Type.Optional(Type.String())
      })
    }
  }, async (request, reply) => {
    try {
      const consumption = request.body as any;
      
      // Mock response - replace with real repository call
      const result = {
        id: 'new-consumption-id',
        ...consumption,
        timestamp: new Date(),
        recordedBy: 'operator-123'
      };
      
      return result;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to record material consumption' });
    }
  });

  // Get material summary
  fastify.get('/operations/:operationId/materials/summary', {
    schema: {
      params: Type.Object({
        operationId: Type.String({ format: 'uuid' })
      })
    }
  }, async (request, reply) => {
    try {
      const { operationId } = request.params as { operationId: string };
      
      const summary = {
        totalMaterials: 2,
        totalPlannedCost: 950.00,
        totalActualCost: 665.10,
        totalWasteCost: 29.10,
        materialEfficiency: 70.0,
        wastePercentage: 4.2
      };
      
      return summary;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch material summary' });
    }
  });
};

export default materialConsumptionRoutes;
