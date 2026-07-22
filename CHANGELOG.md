# Changelog

All notable changes to StudentHub will be documented in this file.

The format follows a lightweight version of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning while it matures.

## [Unreleased]

### Added

- Added recipient-owned real-time notifications with assignment, message, and friend-request domain events.
- Added pure review/comment models and dependency-free architecture regression tests.

- Added password-reset and email-verification workflows.
- Added editable student profile fields with Firebase Auth and Firestore updates.
- Added required Firestore indexes for ordered resources and notifications.
- Added `.env.example` for Firebase web configuration.
- Added attachment-free study-group assignments with member access checks, a creation form, empty/error states, and due-date-derived status labels.
- Added formal project documentation files:
  - `CONTRIBUTING.md`
  - `LICENSE`
  - `.gitignore`
  - `docs/architecture.md`
  - `docs/firestore-schema.md`
  - `docs/roadmap.md`

### Changed

- Hardened notification, review, and comment Firestore authorization and validation.
- Added bounded list/listener queries and cached group notification recipient lookups.
- Standardized focus trapping for custom image and message-deletion dialogs.

- Unified resource upload validation around the shared 25 MB policy and Office-file support.
- Improved conversation-load failures with an explicit error state.
- Restricted collection-group membership reads to each signed-in user's own membership records.
- Updated the README into a project overview with setup, structure, and documentation links.
- Consolidated Firestore documentation into `docs/firestore-schema.md`.
- Removed dead JavaScript wrapper files and direct pages to service modules.
- Centralized shared DOM helpers in `js/utils/dom.js`.
- Centralized resource action bookkeeping for downloads and purchases.
- Separated route bootstraps into `js/pages/` and Firebase/business modules into `js/services/`.
- Scoped page-specific CSS to explicit `data-page` roots to prevent cross-page style leakage.
- Standardized page and stylesheet filenames on kebab-case.

### Removed

- Removed unused `css/pages/register.css`.
- Removed legacy `js/auth.js`, `js/resources.js`, and `js/admin-dashboard.js` wrapper files.

### Fixed

- Fixed dark-theme contrast on authentication marketing panels.
- Removed the unauthorized legacy activity-collection query.

## [2.0.0] - 2026-07-03

### Added

- Firebase Authentication.
- Login and registration pages.
- Automatic dashboard redirects.
- Role-based authentication and admin role support.
- Firestore integration for users, resources, transactions, and activities.
- Dashboard redesign with sidebar navigation, dynamic greeting, statistics cards, recent activity, quick actions, and responsive layout.
- Landing page branding, hero section, features section, responsive navigation, and footer.
- Shared theme, button, form, card, alert, and badge styling.
- Activity service and dashboard activity feed.

### Changed

- Improved folder structure.
- Improved CSS organization.
- Improved JavaScript modularization.
- Improved dashboard layout, navigation, and branding consistency.

### Fixed

- Registration redirect flow.
- Dashboard greeting.
- Firestore role handling.
- Statistics rendering.
- Authentication flow.

### Known Issues

- Firebase Storage must be configured before uploads can complete.
- Some workflows still need broader automated test coverage.
