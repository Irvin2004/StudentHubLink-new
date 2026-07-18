# Changelog

All notable changes to StudentHub will be documented in this file.

The format follows a lightweight version of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning while it matures.

## [Unreleased]

### Added

- Added formal project documentation files:
  - `CONTRIBUTING.md`
  - `LICENSE`
  - `.gitignore`
  - `docs/architecture.md`
  - `docs/firestore-schema.md`
  - `docs/roadmap.md`

### Changed

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
