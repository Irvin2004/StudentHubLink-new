# Knowledge Discovery

The protected `/app/discover` route is StudentHub's unified knowledge search. It
assembles an authenticated student's accessible catalog from:

- resources in joined communities;
- solved community questions and their accepted answers;
- knowledge collections in joined communities;
- the student's private quizzes and flashcard sets; and
- public communities plus private communities the student has joined.

## Permission boundary

Discovery does not use a public search copy of protected content. Firestore
loads community content one joined community at a time under the existing
membership rules. The catalog builder applies the membership set again before
including a resource, question, or collection. Personal quizzes and flashcard
sets are read only from `users/{uid}`. Public community metadata is
discoverable, but internal community content remains hidden until the student
joins.

## Ranking

V2 ranking is deterministic and understandable:

```text
score = relevance × 0.60 + helpfulness × 0.25 + freshness × 0.15
```

Relevance uses normalized title, description, tags, subject, community, and
contributor text. Helpfulness uses visible domain signals such as votes,
accepted answers, curated item count, contributor reputation, member count, or
item count. Freshness decays over one year. Students can bypass the combined
score by sorting explicitly by newest or most helpful. No embeddings or vector
index are used.

## Thuto handoff

`discover-study-context.js` routes resources through `resource-context.js` and
collections through `collection-study-context.js`. Solved questions, personal
quizzes, and personal flashcard sets are converted to the same bounded study
context contract. The existing Thuto dialog then supports explaining,
summarising, creating flashcards, creating a quiz, asking questions, and
planning study against that selected context.
