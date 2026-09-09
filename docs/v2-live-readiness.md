# V2 live readiness — 2026-09-08

Candidate: **2.0.0-rc.1**, selected by the release owner. Target:
`studenthub-c9bc0`.

## Gate status

| Gate                        | Status                  | Evidence                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live Firebase authorization | Partial; not signed off | Anonymous queries to `users` and `communities` return HTTP 403. Deployed Firestore rules differ from the RC. Authenticated student/trusted-contributor/moderator/admin allowed-and-denied cases still need test sessions and the candidate backend.                                                                                                                                                   |
| Accessibility/mobile        | Partial; not signed off | Local production build: home, login, and registration have no horizontal overflow at 360, 768, 1024, or 1440 px. Login/registration inputs have labels. Keyboard navigation reaches the home link, email, password, and password-reset control in order; reset with no email produces feedback without sending a request. Authenticated workflows and screen-reader/contrast sign-off remain pending. |
| Deployment verification     | Blocked                 | The configured Hosting URL displays Firebase's Site Not Found page. No Cloud Functions are deployed. Only a Firestore rules release is listed; no Storage release is listed.                                                                                                                                                                                                                          |
| Release-version alignment   | Local files aligned     | Package, lockfile root, lockfile package metadata, and changelog agree on 2.0.0-rc.1. No candidate tag or release archive has been created; the working tree still contains uncommitted RC work.                                                                                                                                                                                                      |

## Live observations

- The configured site is
  [studenthub-c9bc0.web.app](https://studenthub-c9bc0.web.app).
- `.env.local` points to the same project as `.firebaserc` (checked without
  printing credentials).
- Firestore release `cloud.firestore` was last updated
  `2026-08-31T15:46:28.456799Z`; its source does not match local
  `firestore.rules`.
- All ten returned composite indexes are `READY`, including the `files`
  collection-group index. The CLI also lists the expected `files.communityId`
  and `members.userId` collection-group field overrides.
- `firebase functions:list` returns an empty list.
- The local protected `/app/study-planner` route redirects an unauthenticated
  browser to `/login`.

The anonymous checks were read-only queries. No accounts, production records,
rules, Hosting releases, Functions, or download tokens were changed. Admin CLI
access was used only to inspect configuration; it is not evidence that normal
student requests are authorized.

## Validation and remaining work

The candidate production build and all 174 architecture tests passed after the
version update. The previous code-fix gate passed 543 unit tests and five
Firebase emulator tests; these remain local evidence, not live authorization
sign-off.

Before release:

1. Confirm this is the intended rollout target, or supply the existing staging
   URL if testing should occur elsewhere.
2. Deploy the candidate Firestore/Storage rules, required Functions, and
   Hosting; revoke existing legacy marketplace download tokens and verify old
   links fail.
3. Use test-account sessions for student, trusted contributor, moderator, and
   admin checks. Do not put passwords in the review document or chat.
4. Run the full authenticated learning loop and keyboard/mobile regression,
   screen-reader checks, error recovery, and deployment/rollback smoke tests.
5. Commit the reviewed candidate, require both CI jobs, then create the matching
   tag/archive as part of release publication.

The old July 3 changelog version label is preserved as historical context. Only
`v1.0.0` is present in the local Git tag list; the RC entry makes the intended
current version explicit without rewriting historical tags.
