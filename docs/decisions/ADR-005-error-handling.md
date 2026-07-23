# ADR-005: Centralize application feedback and error presentation

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

Controllers previously used inconsistent combinations of `alert()`,
`console.error()`, inline text, and one-off toast helpers. Users received
different messages for similar failures, technical Firebase messages could leak
into the interface, and overlapping notices were difficult to manage.

The application also needs success, information, and warning feedback, so a
component named only for errors would be unnecessarily narrow.

## Decision

StudentHub uses:

- centralized notice types in `error-types.js`;
- `AppError` for safe structured application errors;
- `error-service.js` to normalize, log, and present notices;
- `user-feedback-service.js` as a compatibility facade for migrated callers;
- `logger.js` as the only direct development console-error boundary; and
- a generic `toast.js` component for queued visual presentation.

Services throw errors and never decide how they appear. Controllers decide
whether to recover, display, or rethrow. The toast component owns its DOM,
queue, dismissal timers, manual close behavior, and ARIA live-region semantics.

Direct `alert()` is not used. Raw technical messages are logged during
development while users receive safe, actionable text.

## Consequences

### Positive

- Similar errors produce consistent messages.
- Technical details remain available to developers.
- Toasts do not overlap.
- Success and informational notices reuse the same component.
- Accessibility behavior is defined once.

### Trade-offs

- Controllers must provide useful context and fallback messages.
- The error service is a deliberate application-facing facade over a UI
  component.
- Unexpected errors still need monitoring in production; console logging alone
  is not a complete observability strategy.

## Alternatives considered

### Keep page-specific error handling

This is flexible but produces inconsistent wording, accessibility, and cleanup.

### Name the component `error-toast`

The component also displays success, warning, and information notices, so a
generic toast name better reflects its responsibility.

### Display every service error automatically

Services do not know whether a controller can recover silently, retry, show an
inline state, or rethrow. Presentation therefore remains a controller decision.
