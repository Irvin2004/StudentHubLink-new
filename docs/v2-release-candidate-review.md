# V2 release candidate review

Review date: 2026-09-06.

**Remediation: all five code findings below have been addressed.** Live rollout
and manual release sign-off remain outstanding.

The fixes add a membership-scoped collection-group rule with ten-community query
batches, retire public legacy marketplace Storage access, correct absent-score
classification, separate memory from study content, and save generated decks and
quizzes in atomic batches. Existing owner recovery reads/deletes remain
available on the retired Storage path; the V2 library uses community files.

Validation: `npm run check` passed with 543 unit tests, 174 architecture tests,
and a successful production build. Five additional Firestore/Storage emulator
tests passed, including forbidden community queries and rejected atomic writes.
The emulator suite is also configured as a separate CI job; repository branch
protection must require both jobs. Application and rules fixes are local only.
Previously issued legacy download tokens still need revocation during rollout.

The original review findings and reproductions are retained below for
traceability. This review and remediation cover the current working tree,
including uncommitted V2 changes. No deployed Firebase configuration was
changed. It supersedes the readiness assessment in `v2-integration-review.md`;
that document remains useful as an integration map.

## Blocking findings

### 1. P1: resource-library queries have no matching collection-group permission

Evidence: `src/services/file-service.js:419` queries
`collectionGroup(db, FILES)` with a community filter. `firestore.rules:2146`
permits file reads only under
`communities/{communityId}/channels/{channelId}/files/{fileId}`. The only
specific recursive collection-group permission is for `members`; the final
recursive fallback denies reads.

An account with community memberships reaches this query when opening Resources.
Discover also depends on it, so a rejection prevents its catalog from loading.
This is a source-and-documentation finding, not an observed production request.
Firebase explicitly requires a recursive rule for collection-group queries; an
index alone does not grant permission. See
[Firebase query authorization](https://firebase.google.com/docs/firestore/security/rules-query#collection_group_queries_and_security_rules).

Close when: either use queries compatible with the existing path rules or add a
carefully scoped collection-group rule. Verify member success, nonmember denial,
mixed permitted/forbidden community filters, and forged community fields with
the rules emulator. Preserve tenant isolation and account for rule access-call
limits when choosing community batch sizes.

### 2. P1: unapproved marketplace files are publicly readable

Evidence: `storage.rules:148` grants `allow read: if true` for
`resources/{userId}/{fileName}`, while `firestore.rules:887` restricts
unapproved resource metadata to its owner or an administrator. Anyone knowing an
object path can read its bytes without satisfying metadata approval. The broad
read also permits listing within that matched scope. This affects the legacy
marketplace Storage namespace even though the React library uses community
files.

Close when: tie object access to an authoritative approval/ownership record, or
retire and deny access to this namespace if it is outside the release. Include
existing objects and issued download links in the migration review. Test
anonymous, unrelated-user, owner, and administrator access before and after
approval; do not make all community files public as a workaround.

### 3. P1: successful concepts are always classified as struggling

Evidence: `src/features/learningMemory/services/learning-memory-service.js:78`
tests `latestQuizPercentage < 60` before checking confidence. Concept callers
pass `-1` to mean no quiz percentage, so every concept enters the struggling
branch. Topics with no quiz result suffer the same problem.

Executed the actual classifier extracted from the source:

| Correct signals | Struggle signals | Quiz percentage | Actual result |
| --------------- | ---------------- | --------------- | ------------- |
| 3               | 0                | -1 (absent)     | struggling    |
| 0               | 0                | -1 (absent)     | struggling    |
| 3               | 0                | 90              | confident     |

`src/features/dashboard/utils/thuto-recommendations.js:70` treats these concept
levels as weakness evidence and gives them focused-study recommendations. Thuto
also tells students they struggled with successful concepts.

Close when: only a present quiz percentage can trigger the low-score branch. Add
regressions through both memory loaders for absent scores, positive flashcard
evidence, neutral activity, and genuinely weak evidence; check the resulting
recommendations and notices.

### 4. P1: Thuto turns learning-memory metadata into study material

Evidence: `src/features/aiAssistant/hooks/useAIAssistant.js:206` appends the
memory prompt to source content. The default provider is `runLocalAI`, whose
`keyPoints` function ranks sentences by length without separating memory from
study content (`src/features/aiAssistant/services/local-ai-provider.js:23`).

Calling the actual `runAIAssistant` service with a photosynthesis sentence plus
the appended memory section produced three cards. The first two card backs
contained the student's topic statistics and concept evidence; only the third
contained the photosynthesis definition. The prompt's instruction to treat
memory as evidence cannot control this deterministic text extractor.

Close when: pass memory separately and use it only for supported
personalization; source extraction must exclude metadata. Add a regression using
the real default provider, checking flashcards, quizzes, summaries, and study
plans with memory present. Keep the documented local-provider limitation
explicit.

### 5. P1: failed generated-material saves leave partial duplicates on retry

Evidence: `src/features/aiAssistant/services/ai-assistant-persistence.js:16`
creates a deck before saving its cards, and line 25 creates a quiz before saving
questions. There is no atomic operation, resume identifier, or cleanup for a
child-write failure. Each retry creates another parent.

Fault injection against the actual `saveAIResult` function body, with service
doubles, failed the second question write: `quiz-1` retained the first question.
A retry created `quiz-2` with both questions and left `quiz-1` behind. The real
question service also sets the parent's full intended question count during each
individual question batch, so partial quizzes can advertise missing items. This
reproduction did not write to Firebase.

Close when: bounded generated sets save atomically, or retries safely resume the
same operation and handle incomplete records. Test a failed child write and
retry for both quiz and flashcard generation. Reviewed planner tasks already use
one batch and should retain that behavior.

## Original review coverage across the seven areas

| Area                        | Assessment                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integration correctness     | Traced routes, resource/collection context, memory recording, recommendation consumers, and reviewed planner persistence. Findings 1, 3, and 4 block the learning loop.                                                                                                                                                                              |
| Security and Firebase rules | Reviewed owner/member/role boundaries, server-owned reputation, callable recalculation authorization, uploads, and query/rule alignment. Findings 1 and 2 require fixes and executable rule tests. `.env.local` is ignored and neither `.env` nor `.env.local` is tracked; this was not a full historical secret scan.                               |
| Performance                 | Routes are lazy-loaded; memory, quizzes, resources, and listeners have query limits. Discover still eagerly fans out across up to 100 memberships, loads accepted answers and quiz attempts, and sorts/renders its catalog locally. Treat large-account latency/read volume as a measurement follow-up; no measured performance blocker established. |
| Error handling              | Shared error boundaries and retry views exist; authoritative learning activity survives a memory-sync failure. Finding 5 blocks reliable generated saves. Silent partial Discover results and lack of durable memory-sync retry are follow-ups.                                                                                                      |
| Accessibility/mobile        | Inspected shared modal focus handling, labeled generated-plan controls, alerts, skip navigation, and responsive styles. Existing component tests passed. No new blocking defect established by source review; keyboard, screen-reader, contrast, and device-width behavior have not been manually signed off.                                        |
| Tests and build             | The preceding `npm run check` completed with exit 0: lint, formatting, 261-file syntax check, 530 unit tests in 152 files, 174 architecture tests, and production build. Diagnostic executions in this review reproduced findings 3–5. Existing rule checks inspect source text and do not evaluate Firebase Rules.                                  |
| Release documentation       | Integration docs and checklist exist. `package.json` is 1.0.0 while the changelog already names 2.0.0 and omits the current V2 learning features. Deployment docs still call the app multi-page. The production workflow deploys Hosting only; separate rule/index/function deployment steps are documented but not verified here.                   |

## Required release evidence after the code fixes

1. Run the full gate on the final candidate and confirm CI for that exact
   commit. Add executable Firestore/Storage allowed-and-denied tests covering
   these findings and student, trusted contributor, moderator, and admin
   boundaries. Remediation added the rules test library and ran local emulators
   with portable Java 21; broader role-workflow sign-off remains outstanding.
   Firebase describes the supported approach in its
   [rules testing guide](https://firebase.google.com/docs/rules/unit-tests).
2. Record target-project rules, Storage, reputation Functions, and index
   deployment evidence; verify indexes are ready. Smoke-test the complete
   learning loop, resource access, and role boundaries against that candidate. A
   successful Hosting deploy alone does not establish backend readiness.
3. Complete keyboard/screen-reader and 360/768/1024/1440 px regression checks,
   offline/error recovery, and deployment/rollback smoke tests. These are
   unverified sign-off items, not claims of observed failures.
4. Reconcile package/lockfile/tag/changelog versions and write current V2
   release notes. Select the intended release number explicitly; do not infer it
   from the existing inconsistent version labels.

The analytics adapter is not configured at bootstrap and currently buffers
locally. This is not a core-learning blocker unless production analytics is an
explicit release requirement. Large-account Discover optimization, richer remote
AI generation, and other enhancements should not expand the blocker list without
evidence that they prevent the agreed V2 workflows.
