# ADR-007: Adopt React as the StudentHub UI platform

- **Status:** Accepted
- **Date:** 2026-07-23
- **Supersedes:** The original Vite-only foundation decision

## Context

StudentHub has grown into an application with authentication, communities,
messaging, settings, and reusable interface elements. Managing these surfaces
with imperative page scripts creates duplicated lifecycle and state-management
work.

The project already uses Vite and the npm Firebase SDK, making an incremental
React migration possible without creating a nested application.

## Decision

StudentHub adopts React and React Router as its primary UI platform.

React owns the application entry point, routing, authentication context, theme
context, settings context, shared components, and all newly migrated pages.
Firebase access remains isolated in services. Reusable stateful behavior belongs
in focused hooks.

Existing browser-native feature pages remain available during the migration.
They must be replaced route by route, with behavior and accessibility coverage,
rather than rewritten simultaneously.

## Consequences

### Positive

- UI state and lifecycle behavior become declarative.
- Protected and guest navigation have one routing boundary.
- Authentication state is shared without prop drilling.
- Page bundles can be loaded lazily.
- Component behavior can be tested with Testing Library.

### Trade-offs

- React and legacy page modules temporarily coexist.
- Contributors must avoid duplicating business logic in components.
- Migrated routes must preserve the existing product's functionality and
  accessibility.

## Guardrails

- Services own Firebase and never render UI.
- Components render UI and never query Firestore directly.
- Contexts remain focused by domain.
- Hooks encapsulate reusable stateful behavior.
- Models and utilities remain framework-independent where practical.
