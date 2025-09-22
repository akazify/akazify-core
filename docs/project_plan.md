# Akazify Project Plan v1 (Option A: Package Dependency Model)

This plan aligns with `docs/architecture_refined.md`, the Open Core strategy (`docs/oss_strategy.md`), and the repository approach in `docs/repo_strategy.md` (Option A).


## 0. Objectives & Success Criteria

- Ship an MVP of Akazify Core (OSS) that delivers production execution, basic inventory, and operator UX.
- Establish packaging and CI/CD so commercial editions can consume Core via SemVer dependencies.
- Land first two commercial wins (Advanced or Enterprise) within 6 months via pilots.
- SLOs: 99.9% SaaS availability, p95 API ≤ 300 ms, RPO ≤ 15 min, RTO ≤ 60 min for multi-tenant SaaS.


## 1. Engineering Roadmap

Milestones (indicative; adjust with capacity):

- Sprint 0 (1–2 weeks): Foundations
  - Repos: `akazify-core` (public), `akazify-enterprise` (private)
  - CI: DCO, lint, unit tests, SCA, CodeQL
  - SPDX headers, LICENSE/NOTICE propagation
  - Baseline OpenAPI spec skeleton, domain schemas

- Sprint 1–2 (2–4 weeks): Core Domain & APIs
  - Entities: Site/Area/Work Center/Equipment; Product/BOM/Routing; Inventory (Location/Bin/Lot/Serial)
  - Manufacturing Orders (MES), dispatch, work-to-list
  - REST/GraphQL endpoints, auth (RBAC baseline), audit trail (basic)
  - Operator PWA (Next.js) with offline basics

- Sprint 3–4 (2–4 weeks): Edge & Data
  - Edge gateway: OPC-UA/Modbus read, MQTT ingest, store-and-forward
  - Timeseries ingestion (Timescale), event bus (Kafka), basic dashboards (OEE/ISO 22400)
  - CSV imports + file-based ERP bootstrap

- Sprint 5–6 (2–4 weeks): Hardening & Packaging
  - Tests: integration, contract tests for APIs
  - Performance soak (single-tenant and multi-tenant baselines)
  - Package boundaries: `@akazify/core-sdk`, `@akazify/core-ui`, `@akazify/core-domain`
  - Charts: `akazify-core-charts` Helm package; container images pushed to GHCR

- Beta (6–8 weeks total elapsed): Pilot Readiness
  - UAT with 1–2 pilot sites, feedback loop, bug triage
  - Docs: Admin, Operator, API guides; Quickstarts

- GA (12–16 weeks total elapsed):
  - Security hardening (SAST/DAST), SBOMs, signed releases
  - Stabilize APIs; create LTS branch policy

Commercial tracks (in `akazify-enterprise`, staggered to begin during Sprints 3–6):
- Advanced: SSO/SCIM, ABAC policy engine; Quality (QC/NC/CAPA); Maintenance PM/WO
- Enterprise: Scheduling optimization; EDI + deep ERP connector #1; HA/DR overlays


## 2. Repository & Packaging (Option A)

- Core packages (public):
  - `@akazify/core-sdk`: TypeScript client, generated from OpenAPI; versioned by SemVer
  - `@akazify/core-ui`: shared UI components/styles for operator/admin apps
  - `@akazify/core-domain`: shared validation, zod/io-ts schemas
  - `akazify-core-charts`: Helm charts for Core services
- Images: `ghcr.io/akazify/*` tagged `vX.Y.Z`
- Release flow (Core): tag → build → publish npm packages, images, Helm charts → release notes + SBOM → sign
- Enterprise consumes versions via `package.json`, Helm values, and image tags


## 3. Environments & DevOps

- Environments: dev (shared), staging (pre-prod), prod (multi-tenant SaaS); pilot customer env as needed
- Infra: Kubernetes (managed), Postgres + Timescale, Kafka, Object storage, Redis cache
- Observability: OpenTelemetry, Prometheus/Grafana, Loki/ELK; SLO dashboards
- CI/CD: GitHub Actions (or similar), Argo CD/GitOps for env promotion; blue/green for API/UI
- DR/Backups: snapshots + cross-region backups; quarterly DR test


## 4. Security & Compliance

- Security: SAST/DAST, dependency scanning, image scanning, secrets management (KMS/Vault)
- Policies: least-privilege IAM, TLS 1.2+, AES-256 at rest, key rotation
- Compliance roadmap: ISO 27001/SOC 2 readiness artifacts, GDPR DPA templates; 21 CFR Part 11 features in Enterprise
- Responsible Disclosure: `SECURITY.md`, advisories, embargo process


## 5. Data, Integrations & Edge

- ERP connectors (sequence):
  1) Bootstrap files/CSV (Core)
  2) Dynamics 365 (OData/Dataverse) as first deep connector (Enterprise)
  3) Netsuite as second deep connector (Enterprise)
- EDI standards: X12 850/856/810, EDIFACT ORDERS/DESADV/INVOIC (Enterprise)
- Edge: OPC-UA/Modbus drivers, MQTT Sparkplug B; buffering & QoS 1/2; safe upgrades
- Data governance: retention by class, residency controls by region, PII minimization


## 6. Product, Packaging & Pricing

- Editions: Community (OSS), Advanced (Commercial), Enterprise (Commercial)
- Pricing guidance (to validate with prospects):
  - Advanced: per site + per active user/operator bundle
  - Enterprise: per site + per line/asset tier + SLA uplift + compliance pack
- Packaging boundaries: keep optimization/AI/EDI/HA-DR/compliance features in Enterprise; SSO/SCIM/ABAC, Quality, Maintenance in Advanced+


## 7. Go-To-Market (Marketing)

- ICP: small/medium discrete manufacturers (initial), moving to larger multi-site after pilots
- Positioning: Open, standards-first MES with strong edge and ERP interop; Open Core flexibility
- Assets: website, product one-pager, architecture whitepaper, demo videos, sample datasets
- Community: GitHub issues, discussions, Discord/Slack; “good first issue” program
- Content: case studies (from pilots), blogs on ISA-95, OPC-UA/MQTT, scheduling basics


## 8. Sales & Partnerships

- Sales playbook: ROI narratives (OEE lift, FPY, MTTR reductions), payback calculator
- Programs: SI partners, OEM/driver partners; connector marketplace vision
- Pilots: 2–3 tightly scoped 8–12 week pilots with clear success metrics
- Trials: hosted sandbox of Core; guided demo scripts


## 9. Customer Success & Support

- Onboarding playbooks: by factory size (SME vs mid-market vs enterprise)
- Training: operator, supervisor, admin; role-based modules
- Support: SLAs by edition; knowledge base; in-app help; feedback loops


## 10. Risk Register (selected)

- Complexity creep → Edition gating, guided setup, opinionated defaults
- Integration delays → Start with D365/Netsuite, publish connector contracts early
- Edge reliability → Store-and-forward, QoS, retries, DLQ; offline-first operator flows
- Security posture drift → Automated scans, SBOMs, image signing, regular audits


## 11. Timeline (indicative)

- Month 1–2: MVP Core ready for internal demos; packaging pipeline live
- Month 3: Beta pilots (Core in production pilots; Advanced features WIP)
- Month 4: First Enterprise connector (Dynamics 365) in customer pilot; HA/DR overlay in staging
- Month 5–6: GA; 2 pilot conversions; enterprise features maturing (optimization/EDI)


## 12. Open Decisions

- i18n languages for operator UIs at MVP
- Target regions for first SaaS deployment and data residency
- On-prem/air-gapped support expectations & release cadence
