# Deployment

StudentHub uses Vite to create a React SPA production bundle and Firebase
Hosting to publish the generated `dist/` directory.

## Prerequisites

- Node.js 20 or newer
- npm
- Firebase CLI
- access to the target Firebase project
- production `VITE_FIREBASE_*` values
- a billing-enabled project when deploying Cloud Functions that require it

## Validate a release

Install exact locked dependencies:

```bash
npm ci
npm --prefix functions ci
```

Create `.env.production.local` with the production Firebase web configuration.
Do not commit that file.

Run the complete gate:

```bash
npm run check
npm --prefix functions run lint
```

`npm run check` runs ESLint, Prettier verification, syntax validation, tests,
and the Vite production build.

Run Firebase authorization regressions with Java 21 and Firebase CLI 15.23.0:

```bash
npm run test:rules
```

This uses `firebase.emulators.json` and the isolated `demo-studenthub-v2`
project. CI runs the emulator suite separately from the frontend gate; require
both jobs before release.

V2 retires the legacy marketplace Storage path `resources/{userId}/{fileName}`.
Only owner recovery reads/deletes remain; public reads and new writes are
denied. The current library uses `communities/.../files/...` and remains
membership-scoped. During rollout, revoke existing Firebase download tokens on
legacy marketplace objects and verify old download URLs fail. Deploying rules
alone does not revoke previously issued token URLs. Preserve objects for owner
recovery unless a separate retention decision authorizes deletion.

Preview the generated application:

```bash
npm run preview
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

Smoke-test these canonical routes at desktop and mobile widths before release:

- `/app`
- `/app/communities` and `/community/{id}/channel/{channelId}`
- `/app/chat` and `/app/friends`
- `/app/resources`
- `/app/study-planner`, `/app/flashcards`, and `/app/quizzes`
- `/app/notifications` and `/app/settings`

Verify `/app/files`, `/resources`, and `/community/{id}` redirect without
dropping query parameters. Firebase Hosting's catch-all rewrite must continue to
send direct client-route requests to `/index.html`.

## Manual GitHub deployment

`.github/workflows/deploy.yml` provides a manually dispatched production
workflow. Configure a protected GitHub environment named `production` with:

- `FIREBASE_SERVICE_ACCOUNT`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

`FIREBASE_SERVICE_ACCOUNT` contains the complete service-account JSON used by
the official Firebase Hosting action. Limit repository and environment access,
require deployment approval, and rotate the credential if it is exposed.

The workflow is intentionally `workflow_dispatch` only. Automatic production
deployment should be enabled only after branch protection, required checks, and
rollback procedures are verified.

## Firebase CLI deployment

```bash
npm install --global firebase-tools
firebase login
firebase use --add
npm run build
firebase deploy --only hosting
```

### One-time Firebase Storage initialization

The Firebase CLI cannot create a project's initial default Storage bucket. For a
new project, open **Firebase Console → Build → Storage**, select **Get
started**, choose the production bucket location, and complete the wizard before
running any Storage deployment. Use the same project named in `.firebaserc` and
`VITE_FIREBASE_PROJECT_ID`.

Until this step is complete, `firebase deploy --only storage` fails with
`Firebase Storage has not been set up on project`. Do not enable resource
uploads in production until the repository's reviewed `storage.rules` has been
deployed successfully after initialization.

Deploy Firestore and Storage configuration:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

After deployment, confirm the Firestore indexes report `READY` before running
community, resource-library, or dashboard smoke tests. Collection-group indexes
can remain unavailable briefly while Firestore backfills them.

## Existing-user public profile migration

**Important:** Complete and verify this migration before deploying the Firestore rules that restrict reads of `users/{uid}`. The rules deployment must not precede the migration, or existing users without a `publicProfiles/{uid}` projection may disappear from public profile, friend-search, and contributor views.

The Admin SDK migration processes every existing `users/{uid}` document. It
creates missing public projections and sanitizes existing `publicProfiles/{uid}`
documents by replacing them with an explicit allowlist of presentation fields.
Existing user-edited public values and private visibility settings are retained
when valid. Fields such as email, role, account status, and financial totals are
never copied into the public projection. The script does not delete orphan
public-profile documents that have no corresponding private user document.

Use an operator workstation or trusted deployment environment with Node.js 20,
the installed Functions dependencies, and Application Default Credentials for
the intended Firebase project. The identity must have permission to read `users`
and create/update `publicProfiles` documents.

During the migration, pause profile-editing traffic or run in a controlled
maintenance window so the operator can review a stable result. The migration
uses transactions to re-read each private and public profile before writing,
which protects against ordinary concurrent profile edits.

First run a dry run (the default; it performs no writes):

```bash
npm --prefix functions ci
npm --prefix functions run migrate:public-profiles -- --project=YOUR_FIREBASE_PROJECT_ID
```

Review the exact project ID and the counts of existing and missing profiles.
The dry run does not inspect or change production data. Then, only after the
project owner approves the target, backup, and maintenance window, run:

```bash
npm --prefix functions run migrate:public-profiles -- --project=YOUR_FIREBASE_PROJECT_ID --apply
```

After applying, rerun the dry run and independently verify that every user has
a public profile, profile visibility is correct, and no public profile contains
private keys. Only then deploy the Firestore rules and release the matching
frontend. Do not run this against production until the project owner has
approved the change and a backup/rollback plan is in place. CI never runs the
migration, and it has not been run against production.

Deploy Cloud Functions:

```bash
npm --prefix functions ci
npm --prefix functions run lint
firebase deploy --only functions
```

## Release checklist

- CI is green for the release commit.
- Production environment variables are complete.
- No secret appears in Git history or build output.
- Firestore and Storage Rules match the deployed data model.
- Unapproved resource metadata is visible only to its owner or an administrator.
- Favorites, resource files, and profile images reject cross-user writes or
  deletion.
- Required indexes exist.
- The production bundle was smoke-tested.
- Authentication redirects work on the production origin.
- Private conversations and files reject unauthorized users.
- Error reporting does not expose private information.
- A rollback target is known.
- `CHANGELOG.md` reflects the release.

## Rollback

Firebase Hosting retains release history. If a frontend deployment fails, use
the Firebase console or CLI to restore the last known-good Hosting release.

Rule and function rollbacks require redeploying a reviewed earlier version.
Avoid destructive schema changes that cannot run safely with both the previous
and next frontend release.
