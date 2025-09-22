# Akazify Open Source Strategy

This document defines the open-source (OSS) approach for the Akazify Factory Management System (FMS), aligned with the refined architecture in `docs/architecture_refined.md`.


## Objectives

- Maximize adoption and ecosystem growth for the Core platform.
- Enable OEMs/Integrators to build drivers, connectors, and extensions.
- Preserve monetization for advanced capabilities (optimization, AI, EDI, HA/DR, compliance).
- Provide a trustworthy security and compliance posture.


## Model: Open Core

- Core components are open-source.
- Advanced and Enterprise components are commercial.
- Maintain clear technical and legal boundaries between Core and commercial code.


## License Choices

- Core (Community edition): Apache License 2.0 (Apache-2.0)
  - Rationale: strong patent grant, high enterprise friendliness, encourages adoption and contributions.
- Client SDKs and API definitions: Apache-2.0
- Documentation: Creative Commons Attribution 4.0 (CC BY 4.0)
- Commercial editions (Advanced/Enterprise): proprietary license (EULA)

Note: If stronger anti-cloud protection is needed later, MPL-2.0 can be considered; we intentionally prefer Apache-2.0 now to maximize adoption and partner integrations.


## Feature Split (Initial)

- Community (OSS, Apache-2.0)
  - Users, RBAC (baseline), audit (basic)
  - Sites/Work Centers/Equipment hierarchy
  - Manufacturing Orders (MES execution), dispatch; basic work-to-list
  - BOM & Routing (basic), minimal versioning
  - Inventory: locations, bins, lots/serials, barcode; basic moves
  - Next.js PWA operator UI with offline basics
  - Domain model, REST/GraphQL APIs, webhooks
  - Edge Gateway core: OPC-UA/Modbus read, MQTT ingest, store-and-forward
  - Basic dashboards (ISO 22400 KPIs) and OpenTelemetry instrumentation
  - CSV import/export; generic file-based ERP bootstrap
  - Extension/Plugin SDK

- Advanced (Commercial)
  - SSO (OIDC/SAML), SCIM, ABAC policy engine
  - Quality: QC plans, inspections; Nonconformance & CAPA
  - Maintenance/CMMS: assets, PM schedules, work orders
  - Finite-capacity scheduling improvements; better dashboards
  - Enhanced edge device management and safe upgrade orchestration

- Enterprise (Commercial)
  - Advanced scheduling/optimization engines
  - AI/ML: predictive maintenance, anomaly detection, quality prediction, forecasting
  - EDI (X12/EDIFACT) and deep ERP connectors (SAP/Oracle/D365/Netsuite)
  - Multi-plant coordination; global rollups
  - HA/DR, dedicated tenancy, data residency, private connectivity
  - Compliance features: 21 CFR Part 11 e-signatures/records, validation packs
  - On-prem/air-gapped deployment support and SLAs


## Governance & Community

- Contribution policy: DCO (Developer Certificate of Origin) with Signed-off-by lines.
- Code of Conduct: Contributor Covenant v2.1.
- RFC process for substantial changes to the domain model, APIs, or edge protocols.
- Maintainers team with clear review/merge rules; CI required checks (tests, lint, security scan).
- Roadmap transparency: public issues/milestones, labels for community contributions.


## Security & Compliance

- SECURITY.md with responsible disclosure and coordinated embargo.
- Signed releases and SBOMs (CycloneDX), dependency scanning (SCA), OSSF Scorecard.
- Supply chain hardening goals (SLSA), reproducible builds for releases.
- Privacy: Telemetry is opt-in for OSS by default.


## Versioning & Releases

- Semantic Versioning (SemVer) for Core.
- LTS branches for Core (12–18 months cadence) after 1.0.
- Commercial editions follow Core versions, adding edition-specific build steps.


## Repository Structure (proposed)

- Separate repositories recommended:
  - `akazify-core` (public, Apache-2.0)
  - `akazify-edge` (public, Apache-2.0)
  - `akazify-enterprise` (private, proprietary)
- If monorepo is preferred:
  - `packages/core/` (OSS)
  - `packages/edge/` (OSS)
  - `packages/enterprise/` (private submodule or private registry)
- Clear folder-level LICENSE files and headers to avoid confusion.


## Trademark & Branding

- “Akazify” is a trademark. Use requires adherence to brand guidelines.
- Community forks must use different names and logos unless permitted by trademark policy.
- A formal Trademark Policy will be published (WIP).


## Next Steps

- Add licensing documents and community health files.
- Prepare initial Core roadmap and “good first issues.”
- Define plugin interfaces and extension points.
- Stand up community discussion channels.
