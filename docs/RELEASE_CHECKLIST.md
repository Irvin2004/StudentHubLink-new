# StudentHub Release Checklist

Use this checklist for every release candidate and production release. Record
unresolved items in the issue tracker before tagging a release.

## 2.0.0 release preparation — 2026-09-09

- [x] Set the application and lockfile root versions to `2.0.0`.
- [x] Update changelog and [2.0.0 release notes](releases/2.0.0.md).
- [x] Record Functions/Storage as post-release infrastructure work.
- [x] Record live owner-data and moderator authorization results.
- [x] Run `npm run check` on the updated 2.0.0 workspace: lint, formatting,
      syntax, 544 unit tests, architecture tests, and build passed.
- [ ] Resolve and retest the new friend-request blocker found in
      [real-data QA](v2-real-data-qa.md).
- [ ] Verify file-content preview with valid hosted fixtures.
- [ ] Deploy the drawer fix to Hosting and complete its live smoke check.
- [ ] Decide the disposition of retained, isolated QA accounts and fixtures.
- [ ] Create and inspect the clean release archive.
- [ ] Create the release commit, annotate `v2.0.0`, and push `main` plus the
      tag.

Only documentation/version preparation and the requested local gate are in scope
for this step. No release approval, tag, archive, or deployment is implied. The
checklist below remains a reusable verification template; unchecked items must
not be interpreted as completed.

## 1. Scope and version

- [ ] Release scope is frozen and all included tickets are closed.
- [ ] `package.json` contains the intended semantic version.
- [ ] `package.json`, the release tag, archive filename, and `CHANGELOG.md`
      agree on the intended release version.
- [ ] `CHANGELOG.md` includes the release date, user-facing changes, fixes, and
      known limitations.
- [ ] No debug-only code, temporary feature flags, or test accounts remain.

## 2. Security and privacy

- [ ] `.env`, `.env.local`, credentials, service-account files, and API secrets
      are not tracked.
- [ ] `git ls-files -- .env .env.local` returns no local environment file, and
      `git check-ignore .env.local` confirms it is ignored.
- [ ] Every required `VITE_FIREBASE_*` value is present, and
      `VITE_FIREBASE_PROJECT_ID` matches `.firebaserc`.
- [ ] Any secret that was previously exposed has been rotated.
- [ ] Firestore rules have been reviewed and deployed.
- [ ] Storage rules have been reviewed and deployed.
- [ ] Firebase Storage has been initialized once in the target project's
      console; uploads remain disabled until `storage.rules` deploys.
- [ ] Authentication and role-based permissions have been tested for allowed and
      denied cases.
- [ ] File type, file size, and ownership validation have been verified.
- [ ] Storage access for marketplace resources matches the Firestore approval
      policy; an unapproved file URL cannot bypass metadata authorization.
- [ ] Deploy the legacy marketplace retirement rule and revoke existing download
      tokens for `resources/{userId}/{fileName}` objects. Verify old token URLs
      fail while owners retain authenticated recovery access.
- [ ] User-generated content is rendered safely.

## 3. Quality gates

Run:

```bash
npm ci
npm run check
npm run test:rules
```

Confirm:

- [ ] ESLint passes with zero warnings.
- [ ] Prettier check passes.
- [ ] Syntax checks pass.
- [ ] Unit tests pass.
- [ ] Architecture tests pass.
- [ ] Production build succeeds.
- [ ] Browser console contains no unexpected errors or warnings.

## 4. Manual regression testing

- [ ] Register, sign in, sign out, reset password, and session restoration work.
- [ ] Protected routes redirect unauthenticated users correctly.
- [ ] `/app/files` and `/resources` redirect to `/app/resources` and preserve
      resource query parameters.
- [ ] `/community/{id}` redirects to the community's `general` channel.
- [ ] Community creation, joining, leaving, and permissions work.
- [ ] Channels load and authorised users can create or manage them.
- [ ] Messages send, update in real time, reply, react, and paginate correctly.
- [ ] File upload, validation, download, preview, and deletion work.
- [ ] Global search opens with `Ctrl+K`/`Cmd+K`, returns results, and supports
      keyboard navigation.
- [ ] Notifications display, mark as read, and link to the correct destination.
- [ ] Loading, empty, offline, permission-denied, and generic error states are
      understandable.

## 5. Accessibility and responsive design

- [ ] Core workflows can be completed using only a keyboard.
- [ ] Focus order and focus restoration are correct.
- [ ] Dialogs have accessible names and trap focus appropriately.
- [ ] Form controls have labels and validation messages.
- [ ] Colour contrast and visible focus indicators have been checked.
- [ ] Layouts have been tested at 375 px, 768 px, 1024 px, and 1440 px widths.
- [ ] Dashboard, communities/chat, resources, planner, flashcards, quizzes, and
      friends have no unintended horizontal overflow at mobile widths.
- [ ] Reduced-motion preferences are respected where animations are used.

## 6. Documentation

- [ ] README describes the product, features, technology stack, setup, scripts,
      and deployment.
- [ ] `.env.example` lists every required variable without real values.
- [ ] Architecture, Firebase, security, API, and deployment documentation is
      current.
- [ ] Screenshots or a demo link reflect the current release.
- [ ] Licence and contribution guidance are present.

## 7. Deployment

- [ ] GitHub Actions CI is green on the release commit.
- [ ] Production environment secrets are configured in GitHub.
- [ ] Firebase project and hosting target are correct.
- [ ] Required Firestore collection and collection-group indexes report `READY`.
- [ ] Deployment workflow succeeds.
- [ ] Live site loads over HTTPS and client-side routes work after refresh.
- [ ] Firebase Authentication authorised domains include the production domain.
- [ ] A post-deployment smoke test has been completed.
- [ ] Rollback steps and the previous stable release are available.

## 8. Release package

Create a clean source archive:

```bash
npm run release:archive
```

Verify the generated ZIP does **not** contain:

- [ ] `.git/`
- [ ] `node_modules/`
- [ ] `functions/node_modules/`
- [ ] `dist/` or other generated output
- [ ] `.env` or `.env.*` files, except `.env.example`
- [ ] local logs, emulator data, or editor settings

## 9. Publish

- [ ] Merge the approved release commit into `main`.
- [ ] Create the annotated tag `v2.0.0`.
- [ ] Push the tag.
- [ ] Publish GitHub release notes.
- [ ] Confirm the live version matches the tagged commit.
- [ ] Create follow-up issues for known non-blocking limitations.

## Sign-off

| Role          | Name | Date | Approved |
| ------------- | ---- | ---- | -------- |
| Developer     |      |      | [ ]      |
| Reviewer / QA |      |      | [ ]      |
| Release owner |      |      | [ ]      |
