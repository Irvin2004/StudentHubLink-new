# Contributing to StudentHub

Thank you for helping improve StudentHub. Contributions to code, documentation,
tests, design, accessibility, and issue investigation are all welcome.

This guide describes the workflow and quality standards used by the project.
Please read it before opening a pull request.

## Contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Before you start](#before-you-start)
- [Development setup](#development-setup)
- [Development workflow](#development-workflow)
- [Branch naming](#branch-naming)
- [Commit messages](#commit-messages)
- [Architecture standards](#architecture-standards)
- [Code style](#code-style)
- [Testing](#testing)
- [Accessibility and responsive design](#accessibility-and-responsive-design)
- [Firebase and security changes](#firebase-and-security-changes)
- [Documentation](#documentation)
- [Pull requests](#pull-requests)
- [Reporting bugs](#reporting-bugs)
- [Suggesting features](#suggesting-features)
- [Reporting security vulnerabilities](#reporting-security-vulnerabilities)

## Code of conduct

Participation in StudentHub is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md). Treat contributors with respect, keep
reviews constructive, protect private information, and report conduct concerns
through the private process described in that policy.

## Ways to contribute

You can help by:

- fixing a reproducible bug;
- improving tests;
- improving keyboard, screen-reader, or responsive behavior;
- clarifying documentation;
- reviewing Firestore or Storage rules;
- reducing duplicated code;
- investigating performance problems; or
- proposing a focused feature that solves a documented student need.

For a substantial feature, data-model change, or architectural change, open an
issue before implementation. Early discussion can prevent work that conflicts
with an existing decision or planned milestone.

## Before you start

1. Search existing issues and pull requests for related work.
2. Read the [README](README.md), the
   [Engineering Charter](docs/engineering-charter.md), and the
   [architecture guide](ARCHITECTURE.md).
3. Review the relevant
   [Architecture Decision Records](docs/decisions/README.md).
4. Fork the repository if you do not have write access.
5. Create a focused branch from the current default branch.
6. Keep unrelated formatting or refactoring out of the change.

## Development setup

### Prerequisites

- Git
- Node.js 20 or newer
- npm
- A Firebase project for authenticated and persistent workflows

### Clone the repository

```bash
git clone https://github.com/Irvin2004/StudentHubLink-new.git
cd StudentHubLink-new
```

If you are working from a fork, use your fork URL and add the main repository as
an upstream remote:

```bash
git remote add upstream https://github.com/Irvin2004/StudentHubLink-new.git
git fetch upstream
```

### Install dependencies

Install root project metadata and the Cloud Functions dependencies:

```bash
npm install
npm --prefix functions install
```

### Configure Firebase

Create a local environment file:

```bash
cp .env.example .env.local
```

Environment files are ignored by Git. Never commit a service-account key,
private credential, access token, or local emulator export.

Vite loads these values at development and build time. Configuration is
validated in `src/config/environment.js`, and Firebase SDK instances are
separated under `src/firebase/`.

### Start the application

Start the Vite development server:

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Do not open pages with a `file://` URL. Vite resolves npm modules and provides
the environment configuration used by the browser application.

## Development workflow

1. Update your local default branch.
2. Create a descriptive branch.
3. Make the smallest complete change that solves the problem.
4. Add or update tests.
5. Exercise the affected user flow in a browser.
6. Update documentation and the changelog when required.
7. Run the repository checks.
8. Review your own diff for secrets, generated files, and unrelated changes.
9. Open a pull request.

Example:

```bash
git switch main
git pull --ff-only upstream main
git switch -c feature/message-editing
```

Replace `main` with the repository's current default branch if it differs.

## Branch naming

Use lowercase, hyphenated, descriptive names:

```text
feature/message-editing
feature/voice-playback-speed
fix/reply-scroll-position
fix/theme-system-sync
docs/contribution-guide
refactor/message-service
perf/conversation-rendering
test/message-model
```

Avoid vague names such as `fix`, `update`, `new`, `test`, or `changes`.

## Commit messages

StudentHub follows [Conventional Commits](https://www.conventionalcommits.org/).

Use an imperative, lowercase summary:

```text
feat: add message editing
fix: restore focus after closing the drawer
docs: document Firebase emulator setup
refactor: separate comment rendering from persistence
perf: debounce conversation search
test: cover invalid message replies
style: format theme styles
chore: update development tooling
```

Use these common types:

| Type       | Purpose                              |
| ---------- | ------------------------------------ |
| `feat`     | User-visible capability              |
| `fix`      | Defect correction                    |
| `docs`     | Documentation only                   |
| `refactor` | Internal change without new behavior |
| `perf`     | Performance improvement              |
| `test`     | Test-only change                     |
| `style`    | Formatting without behavioral change |
| `chore`    | Tooling or maintenance               |
| `ci`       | Continuous-integration configuration |

Keep each commit coherent. Do not mix a feature, unrelated cleanup, and
generated files into one commit.

For a breaking change, add `!` after the type or include a `BREAKING CHANGE:`
footer:

```text
feat!: replace legacy conversation identifiers
```

## Architecture standards

The [architecture guide](ARCHITECTURE.md) is authoritative. If a contribution
changes a durable boundary or convention, add or supersede an
[ADR](docs/decisions/README.md).

### Controllers

Controllers coordinate user interaction, services, renderers, state, and
lifecycle cleanup.

Controllers should not:

- build large HTML templates;
- duplicate reusable business rules;
- make unscoped Firestore queries; or
- call another controller's private implementation.

Stateful controllers expose `initialize()` and `destroy()`. Optional lifecycle
methods are `refresh()` and `reset()`.

### Services

Services own a single domain's persistence and operations. They return data,
return unsubscribe functions for subscriptions, or throw errors.

Services do not render application content. The theme and error facades are
narrow, documented infrastructure exceptions; do not use them as precedent for
general DOM work in services.

### Renderers

Renderers receive prepared data and update presentation. They do not import
Firebase, call services, authenticate users, or decide permissions.

Prefer passing the target container and event callbacks explicitly.

### Components

Components provide reusable interface behavior. They communicate through
callbacks, returned state, or events and do not fetch or persist domain data.

Stateful components must clean up their event listeners, timers, observers,
temporary attributes, and global references in `destroy()`.

### Models

Models validate, normalize, and apply defaults. They do not import Firebase,
services, controllers, renderers, or HTML helpers.

### Utilities

Utilities are focused helpers and should be pure where possible. DOM-specific
utilities may accept elements but must not know about StudentHub services or
global application state.

### Page entrypoints

Files in `js/pages/` compose pages, connect authentication and page-level
callbacks, and destroy long-lived work during `pagehide`. Reusable domain logic
does not belong in a page entrypoint.

## Code style

- Use JavaScript ES modules.
- Use lowercase kebab-case filenames.
- Prefer `const`; use `let` only for reassignment.
- Use descriptive names rather than abbreviations.
- Keep functions focused on one responsibility.
- Replace repeated magic values with named constants.
- Avoid new mutable global state.
- Preserve the standard lifecycle names: `initialize`, `destroy`, `refresh`, and
  `reset`.
- Add concise JSDoc to public functions.
- Use semantic CSS design tokens instead of one-off colors, spacing, radii, and
  shadows.
- Reuse existing components and utilities before creating near-duplicates.
- Do not use `alert()` for user-facing feedback.
- Route user-facing notices through the centralized error service.

ESLint and Prettier are authoritative. Run `npm run lint:fix` and
`npm run format` when needed. Avoid manual formatting that conflicts with the
configured tools.

## Testing

Run syntax validation and the full automated suite:

```bash
npm run check
```

Run only the Node test suite:

```bash
npm test
```

Lint Cloud Functions:

```bash
npm --prefix functions run lint
```

Create the production bundle:

```bash
npm run build
```

Before submitting a pull request:

- add unit tests for models and utilities;
- add renderer or component tests for reusable presentation behavior;
- add architecture tests when introducing a new dependency rule;
- verify the affected user flow through the Vite development server;
- inspect browser errors and warnings;
- test the empty, loading, error, and populated states that changed; and
- confirm cleanup for listeners, subscriptions, timers, and observers.

Husky runs lint-staged and the Node test suite before each commit. Do not bypass
the hook except when diagnosing the hook itself.

## Accessibility and responsive design

Accessibility is a requirement for every user-facing change.

Check:

- complete keyboard operation;
- visible focus;
- appropriate accessible names;
- focus movement and restoration;
- screen-reader announcements for dynamic status;
- semantic form labels;
- reduced-motion behavior;
- high-contrast behavior;
- touch targets;
- image alternative text; and
- desktop and mobile layouts.

Prefer native interactive elements. If a custom control is necessary, support
the expected Enter, Space, arrow-key, and Escape behavior where applicable.

## Firebase and security changes

When changing Firebase behavior:

- keep one canonical frontend initialization module;
- keep domain reads and writes in services;
- update `firestore.rules` or `storage.rules` with the data change;
- update `firestore.indexes.json` for new compound-query requirements;
- update `docs/firestore-schema.md`;
- use server timestamps for authoritative creation and update times;
- keep queries bounded;
- validate file type and size in both client and enforceable backend layers;
- test ownership, membership, role, and unauthenticated failure cases; and
- never rely on hidden UI as authorization.

Do not weaken Security Rules to make a failing client request pass. Confirm the
intended data path and authorization model first.

## Documentation

Update documentation when a contribution changes:

- setup or deployment;
- public service APIs;
- folder responsibilities;
- configuration;
- Firebase collections or fields;
- security behavior;
- user-visible functionality; or
- an architectural decision.

Notable changes should be added under `Unreleased` in
[CHANGELOG.md](CHANGELOG.md). Follow
[Keep a Changelog](https://keepachangelog.com/) categories and write entries for
users and maintainers rather than copying commit subjects.

## Pull requests

Keep pull requests focused and small enough to review. A pull request should
include:

```markdown
## Summary

Explain the outcome and the problem it solves.

## Changes

- Describe the important implementation changes.

## Testing

- List commands and user flows that were verified.

## Accessibility

- Describe keyboard, screen-reader, motion, and responsive checks.

## Screenshots

Include before/after evidence for visible changes.
```

Every pull request should:

- have a clear Conventional Commit-style title;
- explain what changed and why;
- reference related issues;
- identify Firebase schema or rule changes;
- include tests or explain why a test is not practical;
- update relevant documentation;
- avoid unrelated generated or formatting changes; and
- pass all currently available checks.

Review feedback is part of the contribution, not a personal criticism. Resolve
or respond to each actionable review comment before requesting another review.

## Reporting bugs

Search existing issues first. A useful bug report includes:

- a concise title;
- the affected page or feature;
- browser and version;
- operating system and device type;
- account role or relevant permissions;
- exact reproduction steps;
- expected behavior;
- actual behavior;
- console output with private data removed;
- screenshots or a short recording when useful; and
- whether the problem is consistent or intermittent.

Never include passwords, tokens, private messages, personal student data, or
service credentials.

## Suggesting features

Describe:

- the student problem;
- who experiences it;
- the proposed outcome;
- alternatives considered;
- accessibility and mobile implications;
- data, security, and notification implications; and
- how success could be measured.

Start with the problem rather than a preferred implementation. Large proposals
may require an ADR before code is written.

## Reporting security vulnerabilities

Do not open a public issue for a suspected vulnerability. Follow the private
reporting process in [SECURITY.md](SECURITY.md).

## Thank you

Every focused contribution helps make StudentHub safer, clearer, faster, and
more useful for students.
