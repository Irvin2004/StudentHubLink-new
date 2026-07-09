# Roadmap

This roadmap tracks the practical steps needed to turn StudentHub into a more complete software product.

## Current Focus

- Stabilize project structure and documentation.
- Keep Firebase workflows consistent across pages.
- Improve resource upload, review, marketplace, and library flows.
- Build confidence with repeatable local checks.

## Next

- Add Firebase security rules to the repository.
- Add a seed data script or documented manual test data.
- Add automated smoke tests for page loading and key interactions.
- Improve upload validation and progress feedback.
- Add better empty, loading, and error states across pages.
- Add profile editing.
- Add settings page or remove placeholder settings links.
- Improve admin review history and resource rejection feedback.

## Later

- Add real payment integration for paid resources.
- Add resource previews.
- Add ratings and reviews.
- Add search indexing or more advanced filtering.
- Add AI study assistant features.
- Add notification preferences.
- Add downloadable reports for admins.

## Technical Debt

- Move inline admin styles into CSS files.
- Add a test runner and CI workflow.
- Normalize naming around `approved` versus `status`.
- Document required Firestore indexes.
- Store Firebase rules and deployment notes in the repository.
- Consider a build step if the app grows beyond simple browser modules.

## Release Themes

### 2.1 - Stability

- Documentation and contribution workflow.
- Shared utilities cleanup.
- Consistent resource action bookkeeping.
- Basic smoke testing.

### 2.2 - Student Experience

- Profile editing.
- Library improvements.
- Resource previews.
- Better marketplace feedback.

### 2.3 - Admin Experience

- Review history.
- Rejection reasons.
- Admin reporting improvements.
- Firestore rules and operational docs.
