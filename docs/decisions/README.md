# Architecture Decision Records

Architecture Decision Records explain why StudentHub adopted durable technical
conventions. They complement `ARCHITECTURE.md`, which describes the current
system.

## Index

- [ADR-001: Use responsibility-based folders](ADR-001-folder-structure.md)
- [ADR-002: Separate renderers from data access](ADR-002-renderer-pattern.md)
- [ADR-003: Place domain data access behind services](ADR-003-service-layer.md)
- [ADR-004: Use root attributes and design tokens for themes](ADR-004-theme-system.md)
- [ADR-005: Centralize application feedback and error presentation](ADR-005-error-handling.md)
- [ADR-006: Use lightweight message replies instead of nested threads](ADR-006-message-replies.md)
- [ADR-007: Adopt Vite while preserving the vanilla component architecture](ADR-007-ui-platform.md)

## Format

Each ADR records:

- status;
- date;
- context;
- decision;
- consequences; and
- alternatives considered.

Accepted ADRs are not rewritten to hide later changes. A new ADR should
supersede an old decision and link back to it.
