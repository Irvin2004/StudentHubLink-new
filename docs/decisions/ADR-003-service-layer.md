# ADR-003: Place domain data access behind services

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

Direct Firebase access from presentation code spreads collection paths,
authorization assumptions, error translation, and query behavior throughout the
application. It also makes repeated queries difficult to identify and tests
dependent on Firebase.

StudentHub has distinct domains such as messages, resources, groups, settings,
presence, notifications, and friendships.

## Decision

Firestore, Storage, and domain-specific Firebase operations belong in focused
services. Each service owns one domain and:

- accepts explicit inputs;
- validates domain preconditions;
- uses models for data normalization;
- returns data or an unsubscribe function;
- throws errors instead of displaying UI; and
- contains no DOM rendering.

Firebase initialization is centralized in `js/firebase/firebase-config.js`. Page
entrypoints may observe authentication state while composing a page, but domain
reads and writes remain service-owned.

Trusted derived-data or privileged workflows belong in Cloud Functions.
Firestore and Storage Rules remain authoritative for direct client access.

## Consequences

### Positive

- Collection paths and queries have clear owners.
- Controllers and renderers are easier to test.
- Repeated reads and subscriptions are easier to optimize.
- Error handling is consistent.
- Firebase implementation details are less likely to leak into UI code.

### Trade-offs

- Simple reads require a service API.
- Cross-domain workflows require deliberate orchestration.
- A service can become too broad if domain ownership is not reviewed.

## Alternatives considered

### Allow controllers to query Firestore directly

This reduces initial file count but duplicates queries and couples application
flow to persistence details.

### Use one global data service

A universal service becomes a dependency hub with unrelated responsibilities and
makes domain changes risky.

### Put all business logic in Cloud Functions

Trusted operations belong on the server, but forcing every safe read and
real-time subscription through callable functions would add latency and reduce
Firestore's client-side strengths.
