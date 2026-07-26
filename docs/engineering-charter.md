# StudentHub Engineering Charter

This charter defines the engineering principles and delivery standards for
StudentHub v1.0. Product, architecture, implementation, review, and release
decisions should align with it.

## 1. Vision

StudentHub is a modern collaboration platform where students can communicate,
share resources, and learn together in organised communities.

Every feature should support that vision.

## 2. Core principles

### Simplicity first

When two solutions solve the same problem, choose the simpler one. Add
complexity only when it provides clear, measurable value.

### Reusability

Do not build the same thing twice. When code or interface patterns begin to
repeat, consider extracting a reusable component, hook, service, or utility.

### Consistency

Every page should feel like part of the same application. Reuse the design
system and established patterns for:

- spacing;
- typography;
- controls;
- loading states;
- empty states; and
- error handling.

### Performance

Performance is part of feature design, not a later cleanup task. Every change
should consider:

- Firestore reads and listener lifecycles;
- component renders and state updates;
- production bundle size; and
- network requests.

### Accessibility

Primary workflows must be usable with:

- a keyboard;
- a screen reader;
- high-contrast settings;
- reduced-motion settings; and
- mobile and touch interfaces.

### Security

Never trust the client. The frontend should provide a clear experience, while
Firestore Security Rules, Storage Rules, and enforceable backend validation must
protect data and permissions.

## 3. Folder and responsibility rules

Reusable user-interface features should follow this structure where practical:

```text
Feature/
├── Feature.jsx
├── Feature.module.css
├── Feature.test.jsx
└── index.js
```

Keep responsibilities separated:

- services contain domain and persistence logic, not user-interface rendering;
- hooks manage state and side effects;
- components render the interface and communicate through explicit inputs and
  callbacks;
- Firebase calls stay out of components; and
- shared behavior belongs in reusable components or utilities.

Existing architecture conventions remain authoritative where the application
uses controllers and renderers rather than React components. See the
[architecture guide](../ARCHITECTURE.md).

## 4. Code standards

### Naming

Use descriptive names that communicate intent.

Prefer:

```js
createCommunity();
```

Avoid:

```js
doThing();
```

### Functions

Each function should have one responsibility. Prefer small operations such as
`login()`, `loadProfile()`, and `navigateToDashboard()` over a single function
that combines unrelated concerns.

### Components

Keep components focused. A component approaching 300–400 lines should prompt a
review for responsibilities that can be extracted cleanly.

## 5. Pull request checklist

Before merging a feature, confirm:

- [ ] ESLint passes.
- [ ] Automated tests pass.
- [ ] There are no browser console errors.
- [ ] The affected workflow is responsive.
- [ ] The affected workflow is accessible.
- [ ] Existing components and utilities are reused where appropriate.
- [ ] Business logic is not duplicated.
- [ ] Error states are handled.
- [ ] Loading states are handled.
- [ ] Empty states are handled.
- [ ] The change has been self-reviewed and peer-reviewed where possible.

## 6. Definition of done

A feature is complete only when:

- it works through the intended user workflow;
- relevant automated and manual tests pass;
- errors are actionable;
- loading and empty states are covered;
- it works across supported viewport sizes;
- it meets the project's accessibility expectations; and
- it has been reviewed.

## 7. Engineering workflow

Every task follows the same cycle:

```text
Plan
  ↓
Implement
  ↓
Test
  ↓
Review
  ↓
Refactor
  ↓
Merge
```

Feature work should branch from `develop`, be reviewed through a pull request,
and merge back into `develop`. Release-ready changes move from `develop` to
`main`.

Do not bypass validation or review to save time.

## 8. What we will not do

To keep StudentHub maintainable, we will not:

- add features without a clear user need;
- duplicate business logic;
- place Firebase calls directly in user-interface components;
- ignore performance warnings; or
- skip tests for core functionality.

## 9. StudentHub v1.0 success metrics

The first release should provide:

- fast page loads;
- stable authentication;
- smooth real-time chat;
- reliable file sharing;
- effective global search;
- meaningful notifications;
- responsive desktop and mobile layouts; and
- a consistent design across primary workflows.

## 10. Long-term vision

After v1.0, StudentHub can expand thoughtfully with:

- AI-powered study assistance;
- assignment and deadline management;
- timetable integration;
- collaborative note-taking;
- mobile applications; and
- lecturer tools.

These capabilities should build on the existing foundation rather than
complicate it prematurely.
