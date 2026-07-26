# ADR-002: Separate renderers from data access

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

Early page modules often fetched Firestore data, built HTML, attached events,
and displayed errors in one function. That made rendering difficult to reuse or
test and made it unclear which layer owned subscriptions and cleanup.

StudentHub needs consistent loading, empty, content, error, accessibility, and
theme behavior across many screens.

## Decision

Renderers receive prepared data and update presentation only. They may create
DOM elements, render lists, compose components, and set presentation-related
accessibility attributes.

Renderers do not:

- import Firebase;
- call services;
- authenticate users;
- save data; or
- decide domain permissions.

Controllers decide which state to render and pass callbacks for user actions.
New renderers should accept a container dependency where practical. Stateful
event behavior belongs in a component or controller with explicit cleanup.

## Consequences

### Positive

- Rendering can be tested without Firebase.
- The same renderer can present cached, live, or test data.
- Loading and empty states stay distinct.
- Business rules do not become hidden inside HTML construction.
- Accessibility presentation is easier to audit.

### Trade-offs

- Controllers must prepare view data.
- Some small interactions require a callback or component.
- Existing renderers that resolve stable page containers will be migrated
  incrementally rather than rewritten without product value.

## Alternatives considered

### Let services return HTML

This couples persistence to presentation and prevents service reuse.

### Let every component fetch its own data

This creates repeated queries, fragmented loading states, and unclear cleanup.

### Use a frontend framework immediately

A framework could provide component rendering, but adopting one would be a
separate product-wide decision. The current renderer pattern preserves clear
boundaries in browser-native JavaScript.
