import { Kafka, KafkaConfig, Producer, Consumer } from 'kafkajs';
import { z } from 'zod';

/**
 * Kafka configuration schema
 */
export const KafkaConfigSchema = z.object({
  brokers: z.array(z.string()).default(['localhost:9092']),
  clientId: z.string().default('akazify-core-api'),
  groupId: z.string().default('akazify-core-group'),
  ssl: z.boolean().default(false),
  sasl: z.object({
    mechanism: z.enum(['plain', 'scram-sha-256', 'scram-sha-512']).optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
});

export type KafkaConfigType = z.infer<typeof KafkaConfigSchema>;

/**
 * Load Kafka configuration from environment variables
 */
export function loadKafkaConfig(): KafkaConfigType {
  const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
  
  return KafkaConfigSchema.parse({
    brokers,
    clientId: process.env.KAFKA_CLIENT_ID || 'akazify-core-api',
    groupId: process.env.KAFKA_GROUP_ID || 'akazify-core-group',
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: process.env.KAFKA_USERNAME ? {
      mechanism: (process.env.KAFKA_SASL_MECHANISM as any) || 'plain',
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
    } : undefined,
  });
}

/**
 * Create Kafka instance
 */
export function createKafka(config?: KafkaConfigType): Kafka {
  const kafkaConfig = config || loadKafkaConfig();
  
  const kafkaOptions: KafkaConfig = {
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers,
  };

  if (kafkaConfig.ssl) {
    kafkaOptions.ssl = true;
  }

  if (kafkaConfig.sasl) {
    kafkaOptions.sasl = kafkaConfig.sasl;
  }

  return new Kafka(kafkaOptions);
}

/**
 * Kafka topics for manufacturing events
 */
export const KAFKA_TOPICS = {
  // Manufacturing execution events
  MANUFACTURING_ORDER_CREATED: 'manufacturing.order.created',
  MANUFACTURING_ORDER_STARTED: 'manufacturing.order.started',
  MANUFACTURING_ORDER_COMPLETED: 'manufacturing.order.completed',
  MANUFACTURING_ORDER_CANCELLED: 'manufacturing.order.cancelled',
  
  // Equipment events
  EQUIPMENT_STATUS_CHANGED: 'equipment.status.changed',
  EQUIPMENT_ALARM: 'equipment.alarm',
  EQUIPMENT_MAINTENANCE: 'equipment.maintenance',
  
  // Quality events
  QUALITY_CHECK_COMPLETED: 'quality.check.completed',
  QUALITY_NONCONFORMANCE: 'quality.nonconformance',
  
  // Inventory events
  INVENTORY_CONSUMED: 'inventory.consumed',
  INVENTORY_PRODUCED: 'inventory.produced',
  INVENTORY_ADJUSTED: 'inventory.adjusted',
  
  // Real-time data streams
  SENSOR_DATA: 'sensor.data',
  PRODUCTION_DATA: 'production.data',
} as const;

/**
 * Event payload schemas for type safety
 */
export const EventSchemas = {
  ManufacturingOrderCreated: z.object({
    orderId: z.string().uuid(),
    orderNumber: z.string(),
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    plannedStartDate: z.string().datetime(),
    timestamp: z.string().datetime(),
  }),
  
  EquipmentStatusChanged: z.object({
    equipmentId: z.string().uuid(),
    equipmentCode: z.string(),
    previousStatus: z.enum(['OPERATIONAL', 'DOWN', 'MAINTENANCE', 'OFFLINE']),
    newStatus: z.enum(['OPERATIONAL', 'DOWN', 'MAINTENANCE', 'OFFLINE']),
    timestamp: z.string().datetime(),
    reason: z.string().optional(),
  }),
  
  SensorData: z.object({
    equipmentId: z.string().uuid(),
    sensorId: z.string(),
    value: z.number(),
    unit: z.string(),
    timestamp: z.string().datetime(),
    quality: z.enum(['GOOD', 'BAD', 'UNCERTAIN']).default('GOOD'),
  }),
};

/**
 * Kafka producer wrapper for manufacturing events
 */
export class ManufacturingEventProducer {
  private producer: Producer;
  private isConnected = false;

  constructor(kafka: Kafka) {
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  async publishEvent(topic: string, event: any, key?: string): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: key || Date.now().toString(),
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
        },
      ],
    });
  }

  async publishManufacturingOrderCreated(event: z.infer<typeof EventSchemas.ManufacturingOrderCreated>): Promise<void> {
    const validatedEvent = EventSchemas.ManufacturingOrderCreated.parse(event);
    await this.publishEvent(KAFKA_TOPICS.MANUFACTURING_ORDER_CREATED, validatedEvent, event.orderId);
  }

  async publishEquipmentStatusChanged(event: z.infer<typeof EventSchemas.EquipmentStatusChanged>): Promise<void> {
    const validatedEvent = EventSchemas.EquipmentStatusChanged.parse(event);
    await this.publishEvent(KAFKA_TOPICS.EQUIPMENT_STATUS_CHANGED, validatedEvent, event.equipmentId);
  }

  async publishSensorData(event: z.infer<typeof EventSchemas.SensorData>): Promise<void> {
    const validatedEvent = EventSchemas.SensorData.parse(event);
    await this.publishEvent(KAFKA_TOPICS.SENSOR_DATA, validatedEvent, event.equipmentId);
  }
}

/**
 * Initialize Kafka topics
 */
export async function initializeKafkaTopics(kafka: Kafka): Promise<void> {
  const admin = kafka.admin();
  
  try {
    await admin.connect();
    
    const topics = Object.values(KAFKA_TOPICS).map(topic => ({
      topic,
      numPartitions: 3,
      replicationFactor: 1, // Adjust for production
    }));
    
    await admin.createTopics({
      topics,
      waitForLeaders: true,
    });
    
    console.log('Kafka topics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Kafka topics:', error);
  } finally {
    await admin.disconnect();
  }
}
