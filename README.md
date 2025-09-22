# Akazify Core

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/akazify/akazify-core/workflows/CI/badge.svg)](https://github.com/akazify/akazify-core/actions)
[![npm version](https://badge.fury.io/js/%40akazify%2Fcore-sdk.svg)](https://badge.fury.io/js/%40akazify%2Fcore-sdk)

Open-source Factory Management System (MES) designed for modern manufacturing environments.

## 🏭 What is Akazify?

Akazify is an **Open Core** Factory Management System that provides:

- **Manufacturing Execution System (MES)** compliant with ISA-95 standards
- **Real-time production tracking** and operator interfaces
- **Edge connectivity** for PLCs, SCADA, and IoT devices (OPC-UA, Modbus, MQTT)
- **Inventory management** with lot/serial traceability
- **Quality management** with inspection workflows
- **Predictive maintenance** and asset management
- **ERP integration** (SAP, Dynamics 365, Netsuite, and more)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+ (installed via Corepack)

### Installation

```bash
# Enable pnpm via Corepack
corepack enable

# Clone the repository
git clone https://github.com/akazify/akazify-core.git
cd akazify-core

# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm -r test
```

### Using the SDK

```bash
npm install @akazify/core-sdk @akazify/core-ui
```

```typescript
import { paths } from '@akazify/core-sdk';

// TypeScript types generated from OpenAPI
type SitesResponse = paths['/v1/sites']['get']['responses']['200']['content']['application/json'];
```

## 📦 Packages

| Package | Description | Version |
|---------|-------------|---------|
| [@akazify/core-sdk](./packages/core-sdk) | TypeScript SDK (generated from OpenAPI) | [![npm](https://img.shields.io/npm/v/@akazify/core-sdk.svg)](https://www.npmjs.com/package/@akazify/core-sdk) |
| [@akazify/core-ui](./packages/core-ui) | Shared UI components | [![npm](https://img.shields.io/npm/v/@akazify/core-ui.svg)](https://www.npmjs.com/package/@akazify/core-ui) |
| [@akazify/core-domain](./packages/core-domain) | Domain schemas and validation | [![npm](https://img.shields.io/npm/v/@akazify/core-domain.svg)](https://www.npmjs.com/package/@akazify/core-domain) |

## 🔧 Architecture

Akazify Core follows a **modular monolith** architecture that can evolve into microservices:

- **Frontend**: Next.js PWA with offline support for operators
- **Backend**: Node.js/FastAPI with PostgreSQL + TimescaleDB
- **Edge**: OPC-UA/Modbus gateway with MQTT and store-and-forward
- **Messaging**: Kafka for events and CDC
- **Observability**: OpenTelemetry with Prometheus/Grafana

See [docs/architecture_refined.md](./docs/architecture_refined.md) for detailed specifications.

## 🏗️ Deployment

### Docker

```bash
docker build -t akazify/core .
docker run -p 8080:8080 akazify/core
```

### Kubernetes (Helm)

```bash
helm install akazify-core ./charts/akazify-core-charts
```

### Cloud (SaaS)

Production-ready hosted version available at [akazify.com](https://akazify.com)

## 📖 Documentation

- [Architecture](./docs/architecture_refined.md) - Technical architecture and design decisions
- [OpenAPI Spec](./openapi/core.yaml) - REST API documentation
- [Contributing](./CONTRIBUTING.md) - How to contribute to the project
- [Project Plan](./docs/project_plan.md) - Roadmap and milestones

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md).

### Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/yourusername/akazify-core.git
cd akazify-core

# Enable pnpm and install dependencies
corepack enable
pnpm install

# Make your changes, then commit with DCO sign-off
git commit -s -m "feat: add new feature"
```

## 🔒 Security

For security vulnerabilities, please see our [Security Policy](./SECURITY.md).

## 📄 License

**Akazify Core** is licensed under the [Apache License 2.0](./LICENSE).

Documentation is licensed under [CC BY 4.0](./docs/licensing/LICENSE-Docs-CC-BY-4.0.txt).

Commercial extensions (Advanced/Enterprise) are available under a proprietary license.

## 🏢 Commercial Support

- **Advanced Edition**: SSO/SCIM, Quality Management, Maintenance
- **Enterprise Edition**: AI/ML, Advanced Scheduling, EDI, Multi-plant

Contact us at [community@akazify.com](mailto:community@akazify.com) for commercial licensing and support.

## 🌟 Community

- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/akazify/akazify-core/discussions)
- **Issues**: [Report bugs and request features](https://github.com/akazify/akazify-core/issues)
- **Website**: [akazify.com](https://akazify.com)

---

<p align="center">
  Made with ❤️ by the Akazify team and contributors
</p>
