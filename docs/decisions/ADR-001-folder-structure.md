# ADR-001: Use responsibility-based folders

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

StudentHub began as a set of page scripts. As messaging, communities, settings,
notifications, and resource workflows grew, locating code by page encouraged
duplicate helpers and mixed persistence, rendering, and event handling.

Contributors need to answer "what responsibility does this file own?" without
first understanding every screen that imports it.

## Decision

JavaScript modules are grouped by responsibility:

- `config/` for constants and defaults;
- `models/` for validation and normalization;
- `services/` for domain operations and persistence;
- `controllers/` for coordination;
- `renderers/` for presentation updates;
- `components/` for reusable UI;
- `utils/` for focused helpers;
- `firebase/` for SDK initialization;
- `events/` for domain event contracts; and
- `pages/` for page composition.

CSS is separated into base rules, components, layouts, pages, and themes.
Firebase Cloud Functions remain under `functions/`.

Files use lowercase kebab-case. A file moves when its responsibility changes,
not merely because it is imported by a different page.

## Consequences

### Positive

- Boundaries are visible from import paths.
- Reusable behavior is easier to discover.
- Architecture tests can reject invalid dependencies.
- Page entrypoints remain smaller.
- Domain ownership becomes clearer during review.

### Trade-offs

- A feature may span several folders.
- Contributors must understand layer responsibilities.
- Moving legacy files can temporarily create larger diffs.

## Alternatives considered

### Organize everything by page

This is initially simple but duplicates shared behavior and makes cross-page
features difficult to maintain.

### Organize everything by feature

Feature folders can work at a larger scale, but StudentHub currently benefits
from strong layer boundaries and direct discoverability. A future ADR may adopt
feature packages if the number of modules makes the current structure costly.
