# Akazify Core API

**Manufacturing Execution System (MES) REST API - ISA-95 Compliant**

A modern, scalable manufacturing execution system API built with TypeScript, Fastify, PostgreSQL, and event-driven architecture.

## 🏗️ Architecture

### **Core Stack**
- **Runtime**: Node.js 20+ with TypeScript
- **Web Framework**: Fastify with TypeBox validation
- **Database**: PostgreSQL 15+ with TimescaleDB extension
- **Event Streaming**: Apache Kafka for real-time manufacturing events
- **Caching**: Redis for session management and performance
- **Documentation**: OpenAPI 3.0 with Swagger UI

### **Manufacturing Standards**
- **ISA-95** compliant data models and operations
- **Equipment hierarchy**: Sites → Areas → Work Centers → Equipment
- **Production planning**: BOMs, Routings, Manufacturing Orders
- **Quality management**: Inspections, non-conformances, metrics
- **Maintenance**: Work orders, preventive/corrective maintenance

## 🚀 Quick Start

### **Prerequisites**
```bash
# Required
Node.js 20+
pnpm 9+
Docker & Docker Compose (for local development)

# Optional (for production)
PostgreSQL 15+
TimescaleDB extension
Apache Kafka 3.4+
Redis 7+
```

### **1. Install Dependencies**
```bash
# From the root workspace
pnpm install

# Or from this package
pnpm -F @akazify/core-api install
```

### **2. Start Development Services**
```bash
# Start PostgreSQL, Redis, Kafka with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready (about 30 seconds)
docker-compose -f docker-compose.dev.yml ps
```

### **3. Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration (defaults work for Docker Compose)
vim .env
```

### **4. Run Database Migrations**
```bash
# Create database schema and seed data
pnpm db:migrate

# Check migration status
pnpm db:status
```

### **5. Start Development Server**
```bash
# Start with hot reload
pnpm dev

# Or build and start
pnpm build
pnpm start
```

### **6. Access the API**
- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

### **7. Development Tools**
- **pgAdmin**: http://localhost:8081 (admin@akazify.com / admin)
- **Kafka UI**: http://localhost:8080
- **Redis Commander**: http://localhost:8082

## 📋 Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build TypeScript to JavaScript
pnpm start            # Start production server

# Database
pnpm db:migrate       # Run database migrations
pnpm db:status        # Check migration status
pnpm db:seed          # Seed database with sample data (coming soon)
pnpm db:reset         # Reset database (coming soon)

# Testing
pnpm test             # Run unit tests
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run end-to-end tests (coming soon)

# Quality
pnpm lint             # Lint TypeScript code
pnpm type-check       # Check TypeScript types
```

## 🔗 API Endpoints

### **Sites Management**
```http
GET    /api/v1/sites                    # List manufacturing sites
POST   /api/v1/sites                    # Create new site
GET    /api/v1/sites/:id                # Get site by ID
PUT    /api/v1/sites/:id                # Update site
DELETE /api/v1/sites/:id                # Soft delete site
GET    /api/v1/sites/statistics         # Site statistics
```

### **Work Centers Management**
```http
GET    /api/v1/work-centers             # List work centers
POST   /api/v1/work-centers             # Create new work center
GET    /api/v1/work-centers/:id         # Get work center by ID
PUT    /api/v1/work-centers/:id         # Update work center
DELETE /api/v1/work-centers/:id         # Soft delete work center
GET    /api/v1/work-centers/statistics  # Work center statistics
GET    /api/v1/work-centers/capacity-metrics # Capacity utilization
```

### **Health & Monitoring**
```http
GET    /health                          # Basic health check
GET    /health/detailed                 # Detailed health with dependencies
GET    /ready                           # Kubernetes readiness probe
GET    /live                            # Kubernetes liveness probe
```

## 📊 Database Schema

### **Physical Hierarchy (ISA-95)**
```
Sites (Manufacturing locations)
  └── Areas (Production areas within sites)
      └── Work Centers (Production units)
          └── Equipment (Machines, tools, sensors)
```

### **Engineering Data**
```
Products (Items manufactured or consumed)
  ├── BOMs (Bill of Materials with versioning)
  │   └── BOM Items (Components and quantities)
  └── Routings (Manufacturing processes)
      └── Routing Steps (Operations and work centers)
```

### **Execution & Operations**
```
Manufacturing Orders (Production instructions)
  └── Operations (Work center assignments)

Work Orders (Maintenance requests)
  └── Tasks (Individual maintenance activities)
```

### **Inventory & Traceability**
```
Locations (Storage areas)
  └── Bins (Storage containers)
      ├── Lots (Batch tracking)
      └── Serial Numbers (Individual item tracking)
```

## 🔄 Event-Driven Architecture

### **Kafka Topics**
- `manufacturing.order.created` - New production orders
- `manufacturing.order.started` - Production started
- `manufacturing.order.completed` - Production completed
- `equipment.status.changed` - Equipment state changes
- `equipment.alarm` - Equipment alarms and alerts
- `quality.check.completed` - Quality inspection results
- `inventory.consumed` - Material consumption events
- `sensor.data` - Real-time sensor readings

### **Event Schema Example**
```typescript
// Manufacturing Order Created Event
{
  orderId: "uuid",
  orderNumber: "MO-2025-001",
  productId: "uuid",
  quantity: 1000,
  plannedStartDate: "2025-01-15T08:00:00Z",
  timestamp: "2025-01-10T14:30:00Z"
}
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Server
NODE_ENV=development
SERVER_HOST=0.0.0.0
SERVER_PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=akazify_core
DATABASE_USER=akazify
DATABASE_PASSWORD=your_password

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=akazify-core-api

# Redis  
REDIS_URL=redis://localhost:6379
```

### **Docker Compose Services**
- **PostgreSQL + TimescaleDB**: Time-series optimized database
- **Redis**: Caching and session management
- **Apache Kafka**: Event streaming and messaging
- **Management UIs**: pgAdmin, Kafka UI, Redis Commander

## 🔒 Security Features

- **CORS** configuration for cross-origin requests
- **Helmet** for security headers
- **Input validation** with TypeBox schemas
- **SQL injection** protection with parameterized queries
- **Rate limiting** (coming soon)
- **JWT authentication** (coming soon)
- **RBAC authorization** (coming soon)

## 📈 Performance Features

- **Connection pooling** for PostgreSQL
- **Redis caching** for frequently accessed data
- **Async/await** throughout for non-blocking operations
- **Database indexing** for optimal query performance
- **Pagination** for large data sets
- **TimescaleDB** for time-series optimization

## 🏭 Manufacturing Features

### **Current (Phase 1.1)**
- Site and work center management
- Equipment hierarchy and status tracking
- Database schema for full MES operations
- Event streaming infrastructure
- RESTful API with OpenAPI documentation

### **Coming Next (Phase 1.2-1.4)**
- Manufacturing order execution
- Real-time equipment monitoring
- Quality management workflows
- Inventory tracking and consumption
- OPC-UA and Modbus device integration
- Production metrics and OEE calculation

## 🧪 Testing

```bash
# Unit tests
pnpm test

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# E2E tests (coming soon)
pnpm test:e2e
```

## 🐳 Docker Deployment

```bash
# Build production image
docker build -t akazify/core-api .

# Run with docker-compose
docker-compose up -d

# Scale services
docker-compose up -d --scale api=3
```

## 📚 API Documentation

Interactive API documentation is available at `/api/docs` when the server is running:

- **Swagger UI**: Complete endpoint documentation
- **Schema validation**: Request/response examples
- **Try it out**: Interactive API testing
- **Authentication**: JWT token support (coming soon)

## 🔍 Monitoring & Observability

### **Health Checks**
- `/health` - Basic service health
- `/health/detailed` - Database, cache, and service status
- `/ready` - Kubernetes readiness probe
- `/live` - Kubernetes liveness probe

### **Logging**
- Structured JSON logging with Pino
- Request/response logging
- Error tracking and stack traces
- Performance metrics (coming soon)

### **Metrics** (Coming Soon)
- Prometheus metrics endpoint
- Manufacturing-specific KPIs
- System performance metrics
- Custom business metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../../LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.akazify.com](https://docs.akazify.com)
- **Community**: [community@akazify.com](mailto:community@akazify.com)
- **Issues**: [GitHub Issues](https://github.com/akazify/akazify-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/akazify/akazify-core/discussions)

---

**Built with ❤️ for the manufacturing industry**
