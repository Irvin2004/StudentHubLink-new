# StudentHub Release Bug Tracker

This tracker records defects and release gaps found during the v1 release-readiness sprint. Findings are logged before fixes are attempted.

## Status values

- **Open**: confirmed and not addressed.
- **Blocked**: testing cannot continue because a dependency or prerequisite is unavailable.
- **Deferred**: intentionally outside the current v1 implementation.
- **Retest**: a fix exists but still needs release verification.
- **Closed**: verified fixed.

## Findings

| ID | Area | Finding | Priority | Status | Evidence / reproduction |
|---|---|---|---|---|---|
| REL-001 | Resources | Firebase Storage is not initialized for `studenthub-c9bc0`, so attachment and resource uploads cannot complete. | Critical | Blocked | Firebase CLI reports that Storage has not been set up for the project. |
| AUTH-001 | Authentication | Password-reset workflow was missing from the login UI and authentication code. | High | Retest | A reset control and `sendPasswordResetEmail()` handler now exist. Empty-email validation passes; Firebase delivery retest was blocked by `auth/network-request-failed`. |
| AUTH-002 | Authentication | Email verification was not implemented. | Medium | Retest | Registration now sends verification email, and unverified users can resend it from Profile. Live delivery still needs an authenticated network retest. |
| AUTH-003 | Authentication | The profile page was read-only. | High | Retest | Profile now includes an edit form that updates Firebase Auth display name and the Firestore user document. Authenticated browser retest was blocked by Firebase network access. |
| FRIEND-001 | Friends | Friend requests are not implemented; the app currently provides one-way follow/unfollow and mutual-follow messaging only. | High | Open | No friend-request create, accept, decline, or cancel client workflow exists. |
| GROUP-001 | Study Groups | Group edit and delete workflows are missing from the client. | High | Open | `group-service.js` implements create/get/join/leave but no update/delete operations. |
| ASSIGN-001 | Assignments | Assignment management was not implemented. | Medium | Retest | The service, group navigation, assignment list/create UI, calculated status, and empty state now exist. Live Firestore verification is pending deployment of the reviewed draft assignment rules. |
| DOC-001 | Documentation | `.env.example` was missing. | Medium | Closed | Added a repository-safe Firebase web configuration template and documented how the static build consumes those values. |
| DOC-002 | Documentation | README contains placeholder screenshot text. | Medium | Open | Firebase Storage/Hosting and deployment instructions are now current; repository screenshots still need to be captured and added. |
| PERF-001 | Messaging | Message history uses an unbounded real-time query with no pagination. | High | Open | `subscribeToMessages()` orders the full conversation but applies no `limit()` or cursor. |
| PERF-002 | Resources | Group resources load the entire collection without pagination. | Medium | Open | `getGroupResources()` uses an ordered `getDocs()` query without a limit or cursor. |
| PERF-003 | Groups | Public group discovery loads every public group at once. | Medium | Open | `getStudyGroups()` has no pagination or result limit. |
| FIRE-001 | Firestore | The dashboard's approved-resources composite index was missing. | High | Retest | Added `resources(status ASC, createdAt DESC)` to `firestore.indexes.json`; Firebase dry-run passes. Index still needs deployment and live verification. |
| FIRE-002 | Firestore | The notifications composite index was missing. | High | Retest | Added `notifications(userId ASC, createdAt DESC)` to `firestore.indexes.json`; Firebase dry-run passes. Index still needs deployment and live verification. |
| FIRE-003 | Firestore | Activity loading also queried the unauthorized legacy `activity` collection. | High | Retest | Loader now queries only canonical `activities`; authenticated live retest is pending. |
| MSG-001 | Messaging | Conversation subscription was denied and presented as a successful empty state. | High | Retest | Added a signed-in-user-only collection-group membership rule and an explicit `Conversations unavailable` UI state. Rules compile; deployment/live retest pending. |
| RES-001 | Resources | Upload file rules were inconsistent across the UI and shared validation. | High | Closed | Upload page now uses shared validation and consistently advertises images, PDF, Office formats, ZIP, and a 25 MB maximum. |
| UI-001 | Authentication | Dark mode made registration marketing content nearly unreadable. | Medium | Closed | Auth marketing panel now uses a stable dark background. Verified at desktop and 390 px mobile widths with no horizontal overflow. |
| QA-001 | Quality | The root application has no automated test runner or release smoke suite. | Medium | Open | There is no root `package.json` or checked-in browser/unit test suite; current verification is manual plus syntax and Functions lint checks. |

## Release-readiness run - 2026-07-19

| Workflow | Result | Evidence |
|---|---|---|
| Public app load | Pass | Landing page rendered meaningful content with the correct title and no console warnings/errors. |
| Theme control | Pass | The landing-page toggle changed `data-theme` to `dark`; the registration-page contrast defect is tracked as `UI-001`. |
| Register | Pass | A synthetic QA account was created and redirected to the dashboard. |
| Invalid login | Pass | Invalid credentials produced `Unable to sign in. Check your details and try again.` and re-enabled the submit button. |
| Valid login | Pass | The synthetic QA account reached the dashboard. |
| Logout | Pass | Logout returned the user to `login.html`. |
| Reset password | Blocked | Workflow is not implemented (`AUTH-001`). |
| Email verification | Blocked | Workflow is not implemented (`AUTH-002`). |
| Update profile | Blocked | Workflow is not implemented (`AUTH-003`). |
| Friend request lifecycle | Blocked | The product implements follows, not friend requests (`FRIEND-001`). |
| Messaging actions | Blocked | No mutual conversation was available, and the live conversation listener is denied (`MSG-001`). |
| Join public group | Pass | Member count changed from 1 to 2 and the control changed to `Joined`. |
| Member permissions | Pass | The member group-detail view exposed no edit or delete control. |
| Leave group | Pass | Confirmation completed, member count returned to 1, and the control changed to `Join group`. |
| Create/edit/delete group | Blocked | Edit and delete are not implemented; creation was not repeated because a prior release QA group already existed (`GROUP-001`). |
| Resource upload/download/preview/delete | Blocked | Firebase Storage is not initialized (`REL-001`); UI/backend file-policy mismatch is tracked as `RES-001`. |
| Assignments | Retest | The attachment-free assignment service and responsive UI are implemented. Live reads/writes remain blocked until the draft assignment rules are deployed (`ASSIGN-001`). |
| JavaScript syntax | Pass | `node --check` passed for 87 application and Functions JavaScript files. |
| Cloud Functions lint | Pass | `npm.cmd --prefix functions run lint` completed successfully. |

### Test data

- Synthetic Firebase Authentication account created: `studenthub.qa.1784451252227@example.com` (manual cleanup required because account deletion is not implemented).
- Existing public QA group `Release Readiness 05436` was joined and then left; its membership returned to the original owner-only state.

## Performance checklist

| Check | Result | Notes |
|---|---|---|
| Fetch only required data | Needs work | Several discovery/history queries fetch full collections; see `PERF-001` through `PERF-003`. |
| Firestore indexes | Retest | Required indexes are now declared and pass Firebase dry-run; deployment and live verification remain. |
| Paginate long lists | Fail | Messages, group resources, and public groups are unbounded. |
| Lazy-load images | Pass (implemented surface) | Chat image previews use `loading="lazy"`. |
| Clean up real-time listeners | Pass (code inspection) | Chat and conversation controllers unsubscribe on `pagehide`; conversation service also clears nested group subscriptions. Live teardown behavior still needs an instrumented test once messaging access works. |
| Avoid unnecessary writes | Review needed | No automated write-count or emulator assertion exists; this remains unmeasured. |

## Repository release-file checklist

| File | Result |
|---|---|
| `README.md` | Present, but stale (`DOC-002`) |
| `LICENSE` | Present |
| `CHANGELOG.md` | Present |
| `CONTRIBUTING.md` | Present |
| `.env.example` | Present |

## Fix verification - 2026-07-21

- All 87 JavaScript files pass `node --check`.
- Cloud Functions pass ESLint.
- `firestore.indexes.json` parses successfully.
- Firebase CLI dry-run compiled the updated Firestore rules and indexes successfully.
- Login renders the password-reset control with accessible labels and no initial console errors.
- Empty-email password-reset validation shows a clear message and leaves the control enabled.
- Registration renders with a dark marketing panel in dark theme at desktop and 390 px mobile widths.
- Mobile registration has no horizontal document overflow.
- Firebase Auth returned `auth/network-request-failed` during live reset delivery and authenticated profile retesting; those workflows remain `Retest`.
- Assignment navigation and the create form render correctly at desktop and 390 px mobile widths without horizontal overflow.
- Assignment reads fail with a clear unavailable state while the reviewed assignment rules remain intentionally undeployed.

## Release verdict

**Not ready for v1 tagging.** Critical infrastructure and major workflow gaps remain open.
