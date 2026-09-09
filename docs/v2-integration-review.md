# StudentHub V2 Integration Review

This review covers the release-critical learning loop:

```text
Quizzes / flashcards / study sessions
    → learning-memory events and concept aggregates
    → Thuto context and personalized recommendations
    → editable Study Planner proposals
    → completed study activity
    → refreshed memory, recommendations, and analytics
```

## Integration status

| Boundary                          | Status    | Verified contract                                                                                                           |
| --------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Quiz → Learning Memory            | Connected | A saved attempt records topic and per-question evidence before the completion refresh event.                                |
| Flashcards → Learning Memory      | Connected | Ratings record concept evidence with a deterministic review event ID, preventing retry double-counting.                     |
| Study sessions → Learning Memory  | Connected | Completed sessions record minutes and activity before notifying dependent views.                                            |
| Learning Memory → Thuto           | Connected | Resource and collection conversations receive bounded, evidence-based memory context.                                       |
| Learning Memory → Recommendations | Connected | Specific struggling concepts outrank broad topics; active work and recent activity affect scoring.                          |
| Thuto → Study Planner             | Connected | Recommendations and generated plans remain editable and confirmation-based.                                                 |
| Knowledge Collections → Thuto     | Connected | Ordered, permission-visible collection items use the existing bounded multi-resource context.                               |
| Cross-feature refresh             | Connected | Quiz, flashcard, session, and planner events refresh dashboard and planner inputs without a page reload.                    |
| V2 Analytics                      | Connected | Privacy-safe completion events cover Thuto, quizzes, flashcards, sessions, collection study, and recommendation scheduling. |

## Gaps fixed during review

1. V2 learning workflows had no product analytics. Completion events were added
   through the shared analytics hook without sending titles, questions, notes,
   filenames, resource content, or other free text.
2. Flashcard learning-memory activities used random IDs. They now use the deck,
   card, and persisted review count to make retried events idempotent.
3. `quizzes-updated` was emitted after a Thuto-generated quiz was saved but had
   no consumers. The dashboard, quiz library, and Study Planner now refresh from
   that event. The planner also refreshes after related flashcard, quiz-attempt,
   study-session, and study-plan events.
4. Large Knowledge Collections grouped their content correctly but lost the
   original item labels needed for learning-memory lookups. Grouped contexts now
   retain those labels, so individual weaknesses remain available to Thuto.
5. The unbounded Vitest worker pool could exhaust Windows worker startup during
   the release gate. Unit-test concurrency is now capped at four workers for a
   repeatable local and CI check.

Learning-memory synchronization remains deliberately non-blocking: a temporary
memory failure must not discard an authoritative quiz attempt, flashcard rating,
or completed study session.

## Release-candidate gates still requiring an environment

The code integration can enter release-candidate testing after the automated
gate passes. The following are operational or manual checks and are not implied
by a successful local build:

- confirm the intended V2 semantic version and complete the changelog;
- deploy and verify Firestore and Storage rules;
- confirm all required Firestore indexes report `READY`;
- run allowed/denied tests with student, trusted contributor, moderator, and
  admin accounts;
- smoke-test the full learning loop against the target Firebase project;
- complete keyboard, screen-reader, mobile-width, offline, and error-state
  regression checks;
- verify the production analytics adapter receives only the approved V2 event
  fields;
- complete deployment and rollback smoke tests.

Use [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the final candidate
signoff.

The shared analytics service currently buffers events locally until an adapter
is configured at application bootstrap. Selecting and configuring the production
analytics destination is therefore an explicit release-environment task, not
part of this repository-only integration pass.
