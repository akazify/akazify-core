import Fastify, { FastifyInstance } from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

// Configuration imports
import { createDatabasePool, testDatabaseConnection, initializeTimescaleDB, loadDatabaseConfig } from './config/database';
import { createKafka, initializeKafkaTopics, ManufacturingEventProducer } from './config/kafka';
import { createRedisClient, testRedisConnection, CacheService } from './config/redis';

// Route imports
import sitesRoutes from './routes/sites';
import workCentersRoutes from './routes/workCenters';

/**
 * Server configuration interface
 */
interface ServerConfig {
  host: string;
  port: number;
  logLevel: string;
  environment: string;
}

/**
 * Load server configuration from environment variables
 */
function loadServerConfig(): ServerConfig {
  return {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.SERVER_PORT || '3001'),
    logLevel: process.env.LOG_LEVEL || 'info',
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Create and configure Fastify server
 */
async function createServer(): Promise<FastifyInstance> {
  const config = loadServerConfig();
  
  const server = Fastify({
    logger: {
      level: config.logLevel,
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  await registerPlugins(server, config);
  
  // Register routes
  await registerRoutes(server);
  
  // Add health check endpoints
  await registerHealthChecks(server);
  
  return server;
}

/**
 * Register Fastify plugins
 */
async function registerPlugins(server: FastifyInstance, config: ServerConfig): Promise<void> {
  // Security plugins
  await server.register(fastifyHelmet, {
    contentSecurityPolicy: config.environment === 'production',
  });

  await server.register(fastifyCors, {
    origin: config.environment === 'development' ? true : /akazify\.com$/,
    credentials: true,
  });

  // Database connection
  const dbConfig = loadDatabaseConfig();
  const connectionString = `postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  
  await server.register(fastifyPostgres, {
    connectionString: connectionString,
  });

  // Test database connection on startup
  const dbPool = createDatabasePool(dbConfig);
  const isDbConnected = await testDatabaseConnection(dbPool);
  if (!isDbConnected) {
    throw new Error('Failed to connect to PostgreSQL database');
  }
  server.log.info('PostgreSQL database connected successfully');

  // Initialize TimescaleDB
  await initializeTimescaleDB(dbPool);

  // Kafka setup
  const kafka = createKafka();
  const eventProducer = new ManufacturingEventProducer(kafka);
  
  try {
    await eventProducer.connect();
    await initializeKafkaTopics(kafka);
    server.log.info('Kafka connected and topics initialized');
    
    // Make producer available throughout the app
    server.decorate('eventProducer', eventProducer);
  } catch (error) {
    server.log.warn('Kafka connection failed, continuing without event streaming:', error);
  }

  // Redis setup
  const redisClient = createRedisClient();
  const cacheService = new CacheService(redisClient);
  
  try {
    await cacheService.connect();
    const isRedisConnected = await testRedisConnection(redisClient);
    if (isRedisConnected) {
      server.log.info('Redis cache connected successfully');
      server.decorate('cache', cacheService);
    } else {
      server.log.warn('Redis connection test failed, continuing without caching');
    }
  } catch (error) {
    server.log.warn('Redis connection failed, continuing without caching:', error);
  }

  // API documentation
  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Akazify Core API',
        description: 'Manufacturing Execution System (MES) REST API - ISA-95 Compliant',
        version: '0.0.1',
        contact: {
          name: 'Akazify Community',
          email: 'community@akazify.com',
          url: 'https://github.com/akazify/akazify-core',
        },
        license: {
          name: 'Apache 2.0',
          url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
      },
      servers: [
        {
          url: config.environment === 'development' 
            ? `http://localhost:${config.port}` 
            : 'https://api.akazify.com',
          description: config.environment === 'development' ? 'Development server' : 'Production server',
        },
      ],
      tags: [
        {
          name: 'Sites',
          description: 'Manufacturing site management',
        },
        {
          name: 'Work Centers',
          description: 'Production work center management',
        },
        {
          name: 'Health',
          description: 'System health and monitoring',
        },
      ],
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}

/**
 * Register API routes
 */
async function registerRoutes(server: FastifyInstance): Promise<void> {
  // API prefix
  await server.register(async function (fastify) {
    // Sites routes
    await fastify.register(sitesRoutes);
    
    // Work Centers routes
    await fastify.register(workCentersRoutes);
    
  }, { prefix: '/api/v1' });
}

/**
 * Register health check endpoints
 */
async function registerHealthChecks(server: FastifyInstance): Promise<void> {
  // Basic health check
  server.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Basic service health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return reply.code(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Detailed health check with dependencies
  server.get('/health/detailed', {
    schema: {
      tags: ['Health'],
      summary: 'Detailed health check',
      description: 'Comprehensive health check including database and external services',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                cache: { type: 'string' },
                events: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const services = {
      database: 'unknown',
      cache: 'unknown',
      events: 'unknown',
    };

    // Check database
    try {
      const dbResult = await server.pg.query('SELECT 1');
      services.database = dbResult.rowCount === 1 ? 'healthy' : 'unhealthy';
    } catch (error) {
      services.database = 'unhealthy';
    }

    // Check cache (if available)
    try {
      if (server.cache) {
        await server.cache.get('health_check');
        services.cache = 'healthy';
      } else {
        services.cache = 'disabled';
      }
    } catch (error) {
      services.cache = 'unhealthy';
    }

    // Check events (if available)
    if (server.eventProducer) {
      services.events = 'healthy';
    } else {
      services.events = 'disabled';
    }

    const overallStatus = Object.values(services).includes('unhealthy') ? 'degraded' : 'healthy';

    return reply.code(200).send({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
    });
  });

  // Readiness probe for Kubernetes
  server.get('/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness probe',
      description: 'Kubernetes readiness probe endpoint',
    },
  }, async (request, reply) => {
    try {
      // Check if database is ready
      await server.pg.query('SELECT 1');
      return reply.code(200).send({ status: 'ready' });
    } catch (error) {
      return reply.code(503).send({ status: 'not ready', error: error.message });
    }
  });

  // Liveness probe for Kubernetes
  server.get('/live', {
    schema: {
      tags: ['Health'],
      summary: 'Liveness probe',
      description: 'Kubernetes liveness probe endpoint',
    },
  }, async (request, reply) => {
    return reply.code(200).send({ status: 'alive' });
  });
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(server: FastifyInstance, signal: string): Promise<void> {
  server.log.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Close Fastify server
    await server.close();
    
    // Close external connections
    if (server.eventProducer) {
      await server.eventProducer.disconnect();
      server.log.info('Kafka producer disconnected');
    }
    
    if (server.cache) {
      await server.cache.disconnect();
      server.log.info('Redis cache disconnected');
    }
    
    server.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    server.log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    const server = await createServer();
    const config = loadServerConfig();
    
    // Set up graceful shutdown
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => gracefulShutdown(server, signal));
    });
    
    // Start listening
    await server.listen({
      host: config.host,
      port: config.port,
    });
    
    server.log.info(`🚀 Akazify Core API server started`);
    server.log.info(`📊 Environment: ${config.environment}`);
    server.log.info(`🔗 Server: http://${config.host}:${config.port}`);
    server.log.info(`📚 API Docs: http://${config.host}:${config.port}/api/docs`);
    server.log.info(`❤️  Health: http://${config.host}:${config.port}/health`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Extend Fastify instance types
declare module 'fastify' {
  interface FastifyInstance {
    eventProducer?: ManufacturingEventProducer;
    cache?: CacheService;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { createServer, start };
