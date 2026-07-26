# StudentHub Architecture

## Purpose

This document explains how StudentHub is organized, how data moves through the
application, and where new code belongs. It is the canonical architecture guide
for contributors.

StudentHub is a Vite-powered, browser-native JavaScript application backed by
Firebase. It uses small ES modules and explicit layer boundaries instead of a UI
framework. The architecture is optimized for:

- maintainability;
- testability;
- accessibility;
- predictable cleanup;
- reusable presentation;
- secure data access; and
- incremental product growth.

## System context

```text
Student
   |
   v
Browser application
   |
   +--> Firebase Authentication
   |
   +--> Cloud Firestore
   |
   +--> Firebase Storage
   |
   `--> Firebase Cloud Functions
```

The frontend is a multi-page application composed of HTML, CSS, and JavaScript
ES modules. Vite provides development serving, npm dependency resolution,
environment injection, and production bundling. Firebase provides identity,
persistence, file storage, real-time subscriptions, and selected trusted backend
workflows.

## High-level application architecture

```text
                       User
                         |
                         v
                  Page entrypoint
                         |
                         v
                    Controller
                    /        \
                   v          v
              Service      Renderer
              /     \          |
             v       v         v
          Model   Firebase  Component
                     |
                     v
          Firestore / Storage / Auth
```

Controllers coordinate a feature. Services own domain operations and
persistence. Renderers and components own presentation. Models validate and
normalize data before it crosses a domain boundary.

Dependencies should move toward lower-level modules. A module must not bypass a
boundary merely because importing Firebase or writing HTML inline appears
quicker.

## Design principles

### Separation of concerns

Each layer has a distinct responsibility:

| Layer           | Responsibility                                                 |
| --------------- | -------------------------------------------------------------- |
| Page entrypoint | Compose a page and connect its lifecycle                       |
| Controller      | Coordinate state, user interaction, services, and presentation |
| Service         | Perform one domain's data access and business operations       |
| Model           | Validate, normalize, and apply defaults                        |
| Renderer        | Turn prepared state into presentation                          |
| Component       | Provide reusable interface structure or behavior               |
| Utility         | Provide a focused helper with no application-state ownership   |
| Config          | Define frozen constants and supported values                   |
| Firebase        | Initialize and export shared Firebase SDK instances            |

### Single responsibility

A module should have one primary reason to change. For example,
`message-service.js` changes when message persistence changes; notification,
presence, and settings behavior belong to their own services.

### Explicit lifecycle ownership

Stateful modules own the listeners, subscriptions, observers, and timers they
create. They expose cleanup so a page can release those resources.

### Progressive enhancement

Loading, empty, content, and error states are separate. Accessibility and
reduced-motion behavior are part of the component contract rather than optional
polish.

### Security at the boundary

Client validation improves user experience, but Firebase Security Rules and
trusted backend code remain authoritative. A hidden button is never an
authorization mechanism.

## Repository structure

```text
StudentHub/
|-- Admin/                 Admin-facing HTML
|-- assets/                Static images and branding
|-- css/
|   |-- base/              Reset, typography, shared variables, utilities
|   |-- components/        Reusable component styles
|   |-- layout/            Shared and responsive layouts
|   |-- pages/             Page-specific styles
|   `-- themes/            Theme tokens and theme overrides
|-- docs/
|   `-- decisions/         Architecture Decision Records
|-- functions/             Firebase Cloud Functions
|-- src/                   Vite entrypoint and migrated application modules
|-- js/                    Modules awaiting incremental source migration
|   |-- components/        Reusable UI primitives
|   |-- config/            Constants and supported-value definitions
|   |-- controllers/       Feature and page-flow coordination
|   |-- events/            Domain event contracts and recipient helpers
|   |-- firebase/          Firebase initialization
|   |-- models/            Validation and normalization
|   |-- pages/             Browser page entrypoints
|   |-- renderers/         Presentation-only DOM updates
|   |-- services/          Persistence and domain operations
|   `-- utils/             Shared helpers
|-- pages/                 Application HTML
|-- scripts/               Repository validation scripts
|-- test/                  Automated tests
|-- firebase.json          Firebase deployment configuration
|-- firestore.rules        Firestore authorization
`-- storage.rules          Storage authorization
```

The reasoning behind this structure is recorded in
[ADR-001](docs/decisions/ADR-001-folder-structure.md).

## JavaScript layers

### Page entrypoints

Files in `js/pages/` compose a complete page. They may:

- resolve page-level DOM references;
- create controllers and components;
- react to authentication state;
- connect page-specific callbacks; and
- destroy long-lived work during `pagehide`.

Page entrypoints should not contain reusable domain logic. When a page function
becomes reusable or difficult to test, move it into the appropriate controller,
service, renderer, component, model, or utility.

### Controllers

Controllers coordinate application flow. They may:

- respond to user interaction;
- decide whether the current state is loading, empty, content, or error;
- call services;
- pass prepared data to renderers;
- coordinate reusable components; and
- own feature-level subscriptions and cleanup.

Stateful controller factories should return:

```javascript
{
    (initialize, destroy);
}
```

They may additionally expose `refresh()` or `reset()` when the feature needs
those operations.

`initialize()` should be safe to call once and preferably idempotent.
`destroy()` must remove event listeners, unsubscribe from real-time data, clear
timers, disconnect observers, cancel scheduled work, and release references.

Controllers must not:

- contain large HTML templates;
- duplicate reusable validation or business rules;
- perform unscoped Firestore queries; or
- reach into another controller's private state.

React authentication state is owned by `AuthProvider` and consumed through
`useAuth()`. Legacy page controllers retain their existing composition while
their features are migrated. Domain reads and writes remain behind services.

### Services

Services are organized by domain, such as messages, notifications, settings,
resources, presence, or groups. A service may:

- query or update Firestore;
- use Firebase Authentication or Storage;
- subscribe to real-time data;
- enforce client-side domain preconditions;
- call a model for validation or normalization; and
- return data or throw a normalized error.

Services must not render application content. Their public APIs should describe
inputs, return values, and subscription cleanup with JSDoc.

Two infrastructure facades have deliberate presentation responsibilities:

- `theme-service.js` is the single owner of root theme attributes and operating
  system theme listeners.
- `error-service.js` standardizes application notices and delegates visual
  display to the generic toast component.

These exceptions are narrow and documented in
[ADR-004](docs/decisions/ADR-004-theme-system.md) and
[ADR-005](docs/decisions/ADR-005-error-handling.md).

### Models

Models define valid application data. They may:

- validate required fields and supported values;
- normalize strings, dates, identifiers, and nested data;
- merge defaults; and
- return clean domain objects.

Models do not import Firebase, services, controllers, renderers, or HTML
helpers. They do not save data.

### Renderers

Renderers receive data and update presentation. They may:

- create or update DOM elements;
- render lists and status views;
- compose reusable components; and
- apply presentation-only accessibility attributes.

Renderers do not fetch data, write to Firebase, authenticate users, or decide
whether an operation is permitted. Event callbacks may be passed in by the
controller, but the renderer does not own the resulting business operation.

New renderers should accept their container as a dependency where practical.
Some established page renderers still resolve a stable page container
internally; these can be migrated incrementally when touched.

See [ADR-002](docs/decisions/ADR-002-renderer-pattern.md).

### Components

Components are reusable interface primitives, including:

- toasts;
- context menus;
- dialogs;
- the navigation drawer;
- the reply composer;
- reaction and voice controls;
- empty states; and
- skeleton loaders.

A stateful component should expose the smallest useful public API and a
`destroy()` method. It owns and cleans up every listener, timer, observer, and
temporary attribute it creates.

Components do not fetch or persist application data. They communicate through
callbacks, returned state, or DOM events.

### Utilities

Utilities solve focused technical problems. Examples include:

- `debounce()`;
- `throttle()`;
- date and file-size formatting;
- sorting and filtering;
- requestAnimationFrame scheduling;
- DOM batching; and
- the Intersection Observer wrapper.

Most utilities are pure. Explicitly DOM-focused utilities, such as focus
trapping and DOM batching, may operate on elements but must not know about
StudentHub services or global application state.

### Configuration

Files in `js/config/` define frozen constants, allowed values, and defaults.
Examples include message types, theme names, error types, empty-state types, and
settings defaults.

Configuration modules contain no business logic and do not mutate their exports.

### Firebase initialization

`src/firebase/app.js` is the single frontend initialization point.
Authentication, Firestore, and Storage instances are exported by focused sibling
modules and re-exported by `src/firebase/index.js`. Authentication explicitly
uses browser-local persistence before installing its state observer.
Configuration is read from validated `VITE_FIREBASE_*` variables.

No private credential or service-account key may be added to frontend code.
Firebase client identifiers must be protected by Security Rules, App Check where
enabled, and API-key restrictions.

### Cloud Functions

Code in `functions/` runs in a trusted server environment. Cloud Functions are
used when an operation must not rely on a client claim, such as maintaining
derived resource-rating data.

Frontend services and Cloud Functions must agree on document paths and data
contracts. Security Rules remain active for direct client access.

## Standard data flow

### Read flow

```text
Page initialization
        |
        v
Controller shows skeleton
        |
        v
Service loads or subscribes
        |
        v
Model normalizes data
        |
        v
Controller selects content, empty, or error state
        |
        v
Renderer updates the UI
```

### Write flow

```text
User action
    |
    v
Component callback / delegated event
    |
    v
Controller
    |
    v
Service validates and writes
    |
    v
Firestore / Storage / Cloud Function
    |
    v
Service result or real-time update
    |
    v
Controller updates presentation
```

Layers may be omitted when they add no value, but responsibilities may not be
moved into the wrong layer. For example, a controller may call a renderer
without a service for a local-only interaction; a renderer may not start a
Firestore query.

## UI state model

Remote-data screens use distinct states:

```text
Loading --> Content
    |         |
    |         `--> Updated content
    |
    +--> Empty
    |
    `--> Error
```

- **Loading** uses a typed skeleton and `aria-busy`.
- **Empty** explains why content is absent and may offer a relevant action.
- **Content** uses the domain renderer.
- **Error** uses a helpful inline state and, when appropriate, a toast.

An empty state is not a loading state, and an error state is not an empty state.

## Error handling

Services return data or throw errors. Controllers decide whether to recover,
show feedback, or rethrow. User-facing notices pass through the centralized
error service:

```text
Service error
     |
     v
Controller
     |
     v
Error service --> Development logger
     |
     v
Toast component
```

The error service converts technical errors into safe messages and standard
types: success, information, warning, and error. The toast component owns queue
behavior, dismissal, timers, and accessible live-region semantics.

Direct `alert()` calls are not permitted. Direct `console.error()` calls are
isolated to the development logger.

## Theme and design-token system

Theme styling is driven by semantic CSS variables:

```text
theme-tokens.css
       |
       +--> light.css
       |
       `--> dark.css
```

The theme service applies one resolved value:

```html
<html data-theme="dark"></html>
```

Components consume tokens such as colors, spacing, radii, and shadows instead of
maintaining theme-specific selectors. System theme changes are observed at
runtime. No component manually changes the root theme attribute.

## Accessibility

Accessibility is a cross-cutting architecture requirement:

- native controls are preferred;
- custom controls expose keyboard behavior and accessible names;
- focus is moved deliberately and restored when overlays close;
- dynamic status uses appropriate live regions;
- visible `:focus-visible` styling is preserved;
- images receive useful alternative text;
- high contrast is token-driven;
- reduced motion affects CSS animation and JavaScript scrolling; and
- global font sizing is applied at the root.

Accessibility settings are applied through presentation attributes rather than
duplicated component logic.

## Performance strategy

StudentHub uses shared performance primitives:

- debounce for bursty input and typing updates;
- throttle for continuous events;
- Intersection Observer for visibility-driven work;
- requestAnimationFrame scheduling for visual updates;
- document fragments for batched rendering;
- lazy image loading;
- bounded Firestore queries and subscriptions; and
- profile and recipient caching where repeated reads would otherwise occur.

Every optimization must preserve correctness, cleanup, keyboard behavior, and
reduced-motion preferences.

## Security model

Security is enforced in layers:

1. Models and services reject invalid client input.
2. Authentication establishes user identity.
3. Firestore and Storage Rules authorize every direct client operation.
4. Cloud Functions own trusted or derived server-side workflows.
5. UI permissions improve clarity but are never treated as enforcement.

See [the security documentation](SECURITY.md) and
[Firestore schema](docs/firestore-schema.md).

## Naming and coding standards

- JavaScript filenames use lowercase kebab-case.
- Factories use `create...`.
- Lifecycle methods use `initialize`, `destroy`, `refresh`, and `reset`.
- Subscription APIs use `subscribe...` and return an unsubscribe function.
- Public functions require concise JSDoc.
- Constants replace repeated magic values.
- Imports should point directly to the layer that owns the behavior.
- Shared CSS uses semantic design tokens.

The spellings `init`, `initialise`, and `dispose` are not used for public
lifecycle APIs.

## Testing and enforcement

`npm run check` runs ESLint, verifies Prettier formatting, performs JavaScript
syntax validation, runs the Node test suite, and creates a production Vite
build. Architecture regression tests currently enforce:

- one canonical Firebase initialization location;
- presentation and model dependency boundaries;
- utility independence from application layers;
- lifecycle naming;
- centralized error logging; and
- lowercase kebab-case filenames.

Unit tests cover models, utilities, renderers, and reusable components.
Integration and browser end-to-end coverage will expand during production
readiness.

## Architecture decisions

Important decisions and their trade-offs are recorded as ADRs:

- [ADR-001: Folder structure](docs/decisions/ADR-001-folder-structure.md)
- [ADR-002: Renderer pattern](docs/decisions/ADR-002-renderer-pattern.md)
- [ADR-003: Service layer](docs/decisions/ADR-003-service-layer.md)
- [ADR-004: Theme system](docs/decisions/ADR-004-theme-system.md)
- [ADR-005: Error handling](docs/decisions/ADR-005-error-handling.md)
- [ADR-006: Lightweight message replies](docs/decisions/ADR-006-message-replies.md)
- [ADR-007: Vite and the UI platform](docs/decisions/ADR-007-ui-platform.md)

An ADR should be added when a decision changes a durable boundary, data model,
deployment strategy, or cross-cutting convention. Superseded ADRs remain in the
repository and link to their replacements.

## Current evolution

The architecture is intentionally incremental. The production-readiness phase
still includes:

- broader service integration tests;
- browser end-to-end tests;
- a complete Security Rules audit; and
- measured performance budgets.

These are documented as pending work rather than assumed capabilities.

## Adding a feature

Before implementing a feature:

1. Identify the owning domain and existing service.
2. Define or extend configuration and model validation.
3. Add the service operation without DOM dependencies.
4. Coordinate it through a controller.
5. Render through an existing renderer or reusable component.
6. Add loading, empty, error, and accessibility behavior.
7. Clean up all long-lived work in `destroy()`.
8. Add tests at the lowest useful layer.
9. Record an ADR if the feature introduces a durable architectural decision.

This structure allows StudentHub to add assignments, polls, calendars, study
tools, live collaboration, and multi-campus support without collapsing domain
and presentation responsibilities into one layer.
