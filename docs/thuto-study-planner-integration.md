# Thuto and Study Planner Integration

Thuto-generated study plans follow a confirmation-based workflow:

```text
Generate plan → Review proposed tasks → Add selected tasks to Study Planner
```

Generated tasks are never written directly from the response. Students first
open **Review study plan**, where they can edit each task's title, subject, due
date, duration, priority, and notes or exclude the task entirely. The review
validates all selected tasks before saving.

Accepted tasks are written atomically with the existing `addStudyTasks` planner
service. A failed batch therefore does not leave a partially created plan. A
successful write emits the shared `study-plan-updated` event so the dashboard
reloads current planner data.

Real resource links are retained on generated tasks. Multi-resource and
collection context identifiers are not stored as resource IDs because they do
not identify a single openable resource; their source title remains visible in
the review instead.

## Learning-memory recommendations

The Study Planner also shows up to three **What to study next** suggestions
derived from saved learning evidence. Concept-level struggle signals take
priority over broad topics, while a developing topic can be suggested after it
has been neglected for at least 14 days. Active planner tasks suppress matching
suggestions to avoid duplicate work.

Each card exposes the evidence behind the suggestion and uses the existing
workload-aware scheduler to propose a date, duration, and priority. Selecting
**Review and schedule** opens the normal task editor with those fields
pre-filled; no planner task is created until the student confirms it. Weekly
generation and re-planning use the same concept-level evidence, while existing
subject-level Thuto tasks remain compatible.

Concept reads are bounded to the most recent eight concepts for each of the
first twelve memory topics. If a concept read fails, topic-level memory remains
available as a safe fallback.

### End-to-end recommendation flow

```text
Quiz / flashcard / completed study session
    → auditable learning-memory events and concept signals
    → dashboard refresh
    → evidence-weighted Thuto recommendation
    → direct study action or editable planner proposal
    → student confirmation
    → Study Planner task
```

Specific struggling concepts receive a higher score than their broad parent
topic. Thuto shows the supporting correct/struggle signal counts on the card,
and carries that evidence into the proposed planner task notes. Recommendations
also consider poor quiz results, available quizzes and flashcards, resources,
deadlines, recent activity, and existing planner work. An active matching task
suppresses a duplicate recommendation.
