# Repository Strategy for Open Core + Commercial Editions

This document proposes a repository structure and sync strategy for Akazify's Open Core model.


## Goals

- Keep the public Core truly open and easy to contribute to.
- Keep commercial code private and clearly separated (compliance, licensing).
- Minimize merge friction and long-lived divergences.
- Enable predictable, versioned consumption of Core by commercial builds.


## Recommended Structure (Separate Repos)

- `akazify-core` (public, Apache-2.0)
  - Core domain, APIs, operator UI basics, edge core, basic dashboards, CSV/bootstrap, plugin SDK.
- `akazify-edge` (public, Apache-2.0) — optional split if Edge grows large.
- `akazify-enterprise` (private, proprietary)
  - Contains Advanced + Enterprise modules and services.
  - Consumes `akazify-core` via dependency (preferred) or VCS linkage (submodule/subtree) as an interim step.

Commercial code is NOT a fork of `akazify-core`. Avoid long-lived forks to prevent drift and merge pain.


## Consumption Options

### Option A (Preferred): Package Dependency Model

Consume `akazify-core` as versioned artifacts.

- Frontend (Next.js): publish OSS packages (e.g., `@akazify/core-ui`, `@akazify/core-sdk`) to npm.
- Backend (Node/Python): publish libraries to npm/PyPI; share API models via OpenAPI schemas.
- Services: publish container images (Core services) tagged by SemVer; Helm charts for deployment.

Pros:
- Clean separation and licensing boundaries.
- Easy updates via SemVer (no merge conflicts).
- Reproducible builds, simpler CI/CD and compliance.

Cons:
- Requires packaging discipline and registries (public for OSS, private for commercial if needed).

Release Flow:
1. Change lands in `akazify-core` main → tag `vX.Y.Z`.
2. CI publishes packages/images.
3. `akazify-enterprise` bumps versions and runs CI.


### Option B: Git Submodule (Interim)

Include Core as a submodule pinned to a commit.

Commands:
```bash
# add
git submodule add https://github.com/akazify/akazify-core.git vendor/akazify-core

# update to latest main
cd vendor/akazify-core && git fetch origin && git checkout origin/main && cd -
git add vendor/akazify-core && git commit -m "chore(core): bump submodule to latest"
```

Pros:
- Precise commit pinning, no code duplication.

Cons:
- Submodules are fiddly for many developers; CI requires care.


### Option C: Git Subtree (Alternative to Submodule)

Vendor Core into Enterprise under a directory and pull updates as needed.

Commands:
```bash
# add (squash history to keep enterprise repo smaller)
git subtree add --prefix=vendor/akazify-core https://github.com/akazify/akazify-core.git main --squash

# pull updates from core
git subtree pull --prefix=vendor/akazify-core https://github.com/akazify/akazify-core.git main --squash
```

Pros:
- No submodule UX issues; everything lives in one tree for CI.

Cons:
- Still requires manual pulls; risk of conflicts; duplicate code in the enterprise repo.


## Why Not a Fork of Core for Commercial?

- **Merge drift**: Long-lived forks diverge quickly; constant upstream merges become error-prone.
- **Governance friction**: It discourages contributing changes back to Core.
- **Security risk**: Patching vulnerabilities must be applied in multiple places.
- **Ambiguous licensing**: Mixing OSS and proprietary in a fork complicates audits.

Use a dependency (Option A) or, if not yet ready, submodule/subtree (Options B/C) — but avoid a long-lived fork.


## Directory Layout (Enterprise Repo)

```
akazify-enterprise/
  vendor/akazify-core/            # submodule/subtree if using B/C (otherwise omit)
  packages/
    advanced/                     # commercial modules
    enterprise/                   # commercial modules
    shared/                       # internal proprietary libs
  services/
    ...                           # enterprise-only services
  charts/                         # Helm charts/overlays
  .github/
    workflows/ci.yml              # runs tests, license checks, DCO, etc.
```


## Governance & Process

- Changes to Core must be proposed and merged in `akazify-core` first.
- Enterprise consumes tagged releases (A) or pinned commits (B/C).
- CI enforces license boundaries (no imports from proprietary into OSS, SPDX headers, NOTICE presence).
- Feature gating via flags and license checks lives in commercial code.


## Update Playbooks

- Package dependency (Preferred):
  - Update `package.json`/`requirements.txt` or Helm chart values to new `akazify-core` versions.
  - CI runs E2E tests; roll forward or revert.

- Submodule:
  - Bump submodule to a tested commit; open PR with changelog.

- Subtree:
  - Pull upstream with `git subtree pull`; resolve conflicts; open PR.


## Transitional Plan

1. Start with Submodule or Subtree while packaging pipelines are built.
2. As soon as stable, switch to Package Dependency model for Core.
3. Maintain clear APIs and plugin points in Core to keep boundaries clean.


## Compliance Notes

- Preserve Apache-2.0 `LICENSE` and `NOTICE` when redistributing Core components.
- Keep proprietary EULA in enterprise repo and artifacts.
- Add SPDX headers to all files (e.g., `SPDX-License-Identifier: Apache-2.0`).


## Decision

- Adopt Separate Repos with Package Dependency (Option A) as the target.
- If needed initially, use Git Submodule (Option B) with a documented update cadence.
- Do NOT maintain a long-lived fork of `akazify-core` for commercial editions.

## Option A Transition Plan & CI Checklist

### Milestones (Weeks 1–4)

1. Registries & Naming
   - npm scope: `@akazify` (public)
   - Container registry: `ghcr.io/akazify` (public images for Core)
   - Helm chart registry: GitHub Pages or OCI via GHCR
   - Optional: PyPI org for Python SDKs

2. Package Boundaries (Core)
   - `@akazify/core-sdk` (TypeScript client, OpenAPI-generated)
   - `@akazify/core-ui` (shared UI components, themes)
   - `@akazify/core-domain` (schemas/models, validation)
   - `akazify-core-charts` (Helm charts/values for Core services)

3. CI/CD (Core)
   - On tag `v*`:
     - Run unit/integration tests
     - Build and publish npm packages (public)
     - Build and push container images (GHCR)
     - Publish Helm charts
     - Generate SBOMs (CycloneDX) and attach to releases
     - Sign images/releases (cosign), attach provenance (SLSA)
     - Update CHANGELOG and create GitHub Release

4. CI/CD (Enterprise)
   - Renovate/Dependabot to open PRs bumping Core package versions
   - On Core bump PR:
     - Run contract/E2E tests
     - If green, auto-merge with approval or promote to staging

### CI Quality Gates

- DCO check (Signed-off-by)
- Lint + formatting checks
- Unit + integration tests
- Dependency scanning (SCA) and CodeQL
- License scanning and SPDX headers
- OSSF Scorecard, basic thresholds
- Container image scanning

### Versioning & Release Policy

- SemVer across packages, synced via release-please or changesets
- Pre-releases: `-alpha.N`/`-beta.N` allowed for early adopters
- Support matrix: latest minor for Core; LTS post-1.0 at 12–18 months cadence

### Developer Experience

- Example apps and quickstarts consuming `@akazify/core-sdk`
- Documentation snippets auto-generated from OpenAPI
- Templates for plugin/extensions (OSS)

### Rollback & Security

- Release rollback playbooks (npm dist-tags, container tags)
- CVE triage SLAs; security advisories; backports to supported branches

### Ownership

- CODEOWNERS in Core for packages and charts
- Release managers roster and escalation paths
