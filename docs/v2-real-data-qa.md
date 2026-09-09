# V2 real-data QA — 2026-09-09

Candidate: StudentHub 2.0.0-rc.1. Target: authenticated
https://studenthub-c9bc0.web.app with live Firestore. Result: **NOT READY — new
friend requests are blocked.**

## Fixtures and scope

Created private community `qa-v2-realdata-20260909` (QA Exam Revision Circle),
four community members, a text channel, four realistic revision messages, three
resource metadata entries, an existing friend, an incoming request, and three
notifications. The signed-in review account participates with the three
dedicated QA identities created during authorization testing. Only QA recipients
received messages or requests. No existing coursework was deleted.

The synthetic QA profiles were given public visibility and descriptive names for
Find People testing. This changes the fixture state from the earlier
private-profile authorization test, not the deployed access rules.

Local setup manifest: `.cache/live-auth/populated.json`. The setup script uses
create-only preconditions for its new documents.

## Observed results

| Area              | Checks                                                                                                                                                                                                                                            | Outcome                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Chat              | Seeded messages, quoted reply and pinned message render; Enter sends a message; own-message edit persists after reopening; keyboard reaction produces a selected count of one                                                                     | PASS for these text-chat flows                          |
| Friends           | Existing friend renders; incoming request accepted using Enter; count changes from one to two; pending request disappears; public QA profile found by name                                                                                        | PASS                                                    |
| Friends           | Add Friend for an unrelated QA profile                                                                                                                                                                                                            | **FAIL**: button returns to Add Friend, no sent request |
| Resources         | Three entries render; grid/list switching; search narrows to Weekly Study Schedule; Spreadsheet filter returns one result; favourite persists after navigation; Add to Study Planner creates Review Calculus Revision Notes with resource context | PASS                                                    |
| Resources preview | PDF dialog opens, focuses Close, reverse Tab wraps to Download, Escape dismisses                                                                                                                                                                  | Dialog keyboard PASS; PDF content UNVERIFIED            |
| Notifications     | Three initial unread items; Mentions filter; individual mark-as-read reduces badge to two; state survives navigation; mention Open link reaches correct community channel; bulk mark-as-read clears badge and disables bulk button                | PASS                                                    |

Populated page geometry was checked at 375, 768, 1024, and 1440 CSS pixels. No
document-level horizontal overflow was observed in the four areas. At 375px,
Friends section tabs use horizontal scrolling; the request actions remain
visible and usable. Screenshots supplemented DOM measurements on mobile Chat,
Friends, Resources and Notifications. This does not represent every possible
dialog/state at every width or a physical-device certification.

Retained UI-created QA data: one sent and edited chat message, one reaction, an
accepted QA connection, one resource favourite, one resource-linked study task,
and the three notifications now marked read. The viewport override was reset
after testing.

## Confirmed blocker: first friend request

Reproduction:

1. Find People → search `QA Naledi`.
2. Select Add Friend on QA Naledi Molefe, who is not already connected.
3. The button briefly disables then returns; no sent-request state appears.

The implementation in `src/features/friends/services/friend-service.js` reads
the pair's `friends` and `friendRequests` documents before creating a request.
The read rules at `firestore.rules` lines 824 and 859 require fields from the
existing document. When the pair has no document, those checks deny the
existence probe.

Independent live verification using a dedicated QA account confirmed:

```text
friends preflight: permission-denied
friendRequests preflight: permission-denied
```

Verifier: `.cache/live-auth/check-friend-preflight.cjs`. It uses real sign-in
and client Firestore reads, not administrator reads. The earlier owner-data and
moderator authorization results remain valid; this is a newly exercised
first-request integration path. Fix and retest sending a first request,
duplicate handling, acceptance, and cancellation before clearing this gate.

## Deferred and unverified coverage

- Cloud Functions deployment remains deferred because the project is on Spark.
- Storage deployment, uploads, attachment transfer, and Storage-backed downloads
  remain deferred until Storage is enabled and the required plan is available.
- Resources in this pass are metadata fixtures, not uploaded Storage objects.
  The PDF entry references an external sample, which displayed a failed embedded
  document in this browser. The image entry has no verified binary backing, and
  the CSV entry is metadata only. These are not successful file-content tests.
- PDF/image content rendering must be retested with valid hosted fixtures or
  uploaded objects. No full resource-preview/download pass is claimed.
- The drawer fix has passed locally, but the earlier review records that it has
  not yet been deployed to Hosting.

Do not publish the proposed READY declaration yet. Functions and Storage may be
explicit deferrals, but the new friend-request failure is an additional release
blocker found by this pass.
