# Changelog

All notable changes to StudentHub will be documented in this file.

The format follows a lightweight version of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
semantic versioning while it matures.

## [Unreleased]

No additional changes recorded after the 2.0.0 release preparation.

## [2.0.0] - 2026-09-09

Release preparation from 2.0.0-rc.1. Version and documentation are updated;
archive, commit, tag, push, and production publication remain pending. See
[release notes](docs/releases/2.0.0.md) for the current gate status.

### Added

- Includes V2 Discover, Learning Memory, Thuto study plans, community
  reputation, knowledge collections, and the integration fixes recorded under
  rc.1 below.
- Live real-account authorization evidence and populated Chat, Resources,
  Friends, and Notifications QA reports.

### Fixed

- Mobile drawer focus entry during its opening animation, with Tab/Shift+Tab
  containment, Escape dismissal, and focus restoration verified locally.

### Known limitations

- New friend requests remain blocked by denied reads of missing connection and
  request documents. This is an unresolved release blocker, not a passed gate.
- Resource file-content previews remain unverified; metadata, favourites,
  filtering, and Study Planner integration passed.
- Cloud Functions deployment is deferred until Blaze is available. Storage
  initialization, rules deployment, and transfer checks are post-release
  infrastructure items. These features must not be represented as deployed.
- The drawer fix still requires Hosting deployment and a live smoke check.
- Thuto uses the local deterministic provider; analytics remains locally
  buffered.

## [2.0.0-rc.1] - 2026-09-08

Release candidate; production deployment and manual sign-off are pending. The
July 3 entry below is a historical version label, not a published V2 tag.

### Added

- Discover for community resources, solved questions, collections, and private
  quizzes and flashcards.
- Learning Memory and evidence-based Thuto recommendations.
- Editable Thuto study plans integrated with the Study Planner.
- Community reputation, trusted curation, and knowledge collections.
- Firebase emulator authorization regressions in CI.

### Fixed

- Authorized community file collection-group queries with bounded batches.
- Retired public access to legacy marketplace Storage objects.
- Corrected learning-memory classification when quiz evidence is absent.
- Kept memory metadata out of generated study material.
- Made generated quiz and flashcard saves atomic.

### Known limitations

- Live rules deployment and legacy download-token revocation remain required.
- Thuto uses the local deterministic provider; analytics remains locally
  buffered.
- Live role authorization, mobile/accessibility, and rollout sign-off are
  pending.

### Earlier unreleased work included in this candidate

### Added

- Added recipient-owned real-time notifications with assignment, message, and
  friend-request domain events.
- Added pure review/comment models and dependency-free architecture regression
  tests.

- Added password-reset and email-verification workflows.
- Added editable student profile fields with Firebase Auth and Firestore
  updates.
- Added required Firestore indexes for ordered resources and notifications.
- Added `.env.example` for Firebase web configuration.
- Added attachment-free study-group assignments with member access checks, a
  creation form, empty/error states, and due-date-derived status labels.
- Added formal project documentation files:
    - `CONTRIBUTING.md`
    - `LICENSE`
    - `.gitignore`
    - `docs/architecture.md`
    - `docs/firestore-schema.md`
    - `docs/roadmap.md`

### Changed

- Hardened notification, review, and comment Firestore authorization and
  validation.
- Added bounded list/listener queries and cached group notification recipient
  lookups.
- Standardized focus trapping for custom image and message-deletion dialogs.

- Unified resource upload validation around the shared 25 MB policy and
  Office-file support.
- Improved conversation-load failures with an explicit error state.
- Restricted collection-group membership reads to each signed-in user's own
  membership records.
- Updated the README into a project overview with setup, structure, and
  documentation links.
- Consolidated Firestore documentation into `docs/firestore-schema.md`.
- Removed dead JavaScript wrapper files and direct pages to service modules.
- Centralized shared DOM helpers in `js/utils/dom.js`.
- Centralized resource action bookkeeping for downloads and purchases.
- Separated route bootstraps into `js/pages/` and Firebase/business modules into
  `js/services/`.
- Scoped page-specific CSS to explicit `data-page` roots to prevent cross-page
  style leakage.
- Standardized page and stylesheet filenames on kebab-case.

### Removed

- Removed unused `css/pages/register.css`.
- Removed legacy `js/auth.js`, `js/resources.js`, and `js/admin-dashboard.js`
  wrapper files.

### Fixed

- Fixed dark-theme contrast on authentication marketing panels.
- Removed the unauthorized legacy activity-collection query.

## Historical V2 draft - 2026-07-03

### Added

- Firebase Authentication.
- Login and registration pages.
- Automatic dashboard redirects.
- Role-based authentication and admin role support.
- Firestore integration for users, resources, transactions, and activities.
- Dashboard redesign with sidebar navigation, dynamic greeting, statistics
  cards, recent activity, quick actions, and responsive layout.
- Landing page branding, hero section, features section, responsive navigation,
  and footer.
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
