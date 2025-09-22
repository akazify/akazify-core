# Contributing to Akazify Core

Thank you for your interest in contributing! This document describes how to contribute to the Akazify Core (OSS) project.


## Code of Conduct

Participation in this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).


## Developer Certificate of Origin (DCO)

We use a DCO to confirm that you have the right to submit your contributions.

- Each commit must be signed off using `git commit -s`.
- The sign-off certifies the DCO found at https://developercertificate.org/.
- Each commit message must include a `Signed-off-by:` line with your name and email address, e.g.:

```
Signed-off-by: Jane Doe <jane.doe@example.com>
```


## How to Contribute

- Search existing issues before opening a new one.
- For substantial changes (domain model, APIs, edge protocols), open a lightweight RFC issue first for discussion.
- Fork the repo and create a topic branch from `main`.
- Add tests and documentation with your changes.
- Ensure `lint`, `test`, and `build` checks pass locally.
- Open a PR with a clear description and link to related issues.


## Coding Guidelines

- Follow project code style and linters (configured in the repo).
- Keep PRs focused; large changes should be split into smaller, reviewable chunks.
- Prefer explicit types and schema validation at service boundaries.


## Commit Messages

- Use conventional commits where possible (e.g., `feat:`, `fix:`, `docs:`).
- Reference issues (e.g., `Fixes #123`).


## Review & Merge

- At least one maintainer approval is required.
- CI must pass.
- Squash-merge unless the commit history is intentionally curated.


## Issue Labels

- `good first issue`: ideal for newcomers
- `help wanted`: maintainers seek assistance
- `rfc`: design discussion needed


## Security

Please do not open public issues for security vulnerabilities. Follow our [SECURITY.md](SECURITY.md) policy for private disclosure.
