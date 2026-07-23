# StudentHub Architecture

StudentHub uses a layered, browser-native JavaScript architecture. Dependencies
flow downward; presentation code never owns persistence or business rules.

## Module responsibilities

- `js/config/` contains frozen constants and configuration values.
- `js/models/` validates and normalizes domain data.
- `js/services/` owns persistence, network access, and domain operations.
- `js/controllers/` coordinates services, renderers, and user interaction.
- `js/renderers/` receives prepared data and updates presentation only.
- `js/components/` contains reusable interface primitives.
- `js/utils/` contains pure helpers, except explicitly DOM-focused helpers such
  as focus trapping and DOM batching.
- `js/firebase/` owns Firebase initialization.
- `js/pages/` contains page entrypoints and page-level composition.
- `js/events/` contains application event contracts and recipient helpers.

## Lifecycle standard

Reusable controllers and stateful components expose `initialize()` and
`destroy()`. Optional lifecycle methods are `refresh()` and `reset()`.
Initialization must be idempotent. Destruction removes listeners, observers,
subscriptions, and timers and may be called more than once.

Page entrypoints may initialize immediately because their document is their
lifecycle boundary. Long-lived work must still be released during `pagehide`.

## Naming

- Files use lowercase kebab-case.
- Factories use `create…`.
- Lifecycle methods use `initialize`, `destroy`, `refresh`, and `reset`.
- Subscriptions use `subscribe…` and return an unsubscribe function.
- British `initialise`, abbreviated `init`, and `dispose` are not used.

## Boundaries

- Services never import renderers or access the DOM.
- Renderers never import services, Firebase, or controllers.
- Models never import services, Firebase, or HTML helpers.
- Components never fetch or persist data.
- Utilities never import controllers, renderers, or domain services.
- Controllers decide whether the current state is loading, empty, content, or
  error; renderers only present that state.

## Errors and diagnostics

User-facing feedback flows through `error-service.js` or
`user-feedback-service.js`. `console.error` is isolated to the development
logger. Services throw normalized errors and never display interface feedback.

## CSS

Shared components consume semantic variables from `theme-tokens.css`.
Light and dark theme files override semantic colors. New spacing, radii,
shadows, and motion values should use tokens rather than one-off values.

## Public APIs

Exported functions require concise JSDoc describing their purpose, parameters,
return value, and cleanup behavior where relevant. Private helpers should be
documented when their behavior is not clear from their name.
