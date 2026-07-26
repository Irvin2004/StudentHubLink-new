# StudentHub v1.0 Release Checklist

Use this checklist for every release candidate and production release. Record
unresolved items in the issue tracker before tagging a release.

## 1. Scope and version

- [ ] Release scope is frozen and all included tickets are closed.
- [ ] `package.json` contains the intended semantic version.
- [ ] `CHANGELOG.md` includes the release date, user-facing changes, fixes, and
      known limitations.
- [ ] No debug-only code, temporary feature flags, or test accounts remain.

## 2. Security and privacy

- [ ] `.env`, `.env.local`, credentials, service-account files, and API secrets
      are not tracked.
- [ ] Any secret that was previously exposed has been rotated.
- [ ] Firestore rules have been reviewed and deployed.
- [ ] Storage rules have been reviewed and deployed.
- [ ] Authentication and role-based permissions have been tested for allowed and
      denied cases.
- [ ] File type, file size, and ownership validation have been verified.
- [ ] User-generated content is rendered safely.

## 3. Quality gates

Run:

```bash
npm ci
npm run check
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
- [ ] Layouts have been tested at 360 px, 768 px, 1024 px, and 1440 px widths.
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
- [ ] Create an annotated tag, for example `v1.0.0`.
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
