# ADR-004: Use root attributes and design tokens for themes

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

Component-specific dark-mode classes create duplicated CSS and require every
component to understand global theme state. StudentHub must support light, dark,
and operating-system themes as well as high contrast, reduced motion, and
adjustable font sizing.

## Decision

Theme and accessibility presentation is driven by semantic CSS variables and
root data attributes.

`theme-tokens.css` defines shared design tokens. `light.css` and `dark.css`
override only theme-dependent values. The active resolved theme is represented
as:

```html
<html data-theme="dark"></html>
```

The theme service is the single owner of:

- applying the root theme attribute;
- resolving the operating-system preference;
- reacting to operating-system changes;
- persisting the selected theme; and
- synchronizing theme controls.

Components consume semantic tokens and do not manually change theme classes or
root attributes.

## Consequences

### Positive

- New components inherit every theme automatically.
- Theme-specific CSS remains small.
- System theme changes apply without a reload.
- High contrast and reduced motion fit the same root-attribute strategy.
- Adding a theme primarily requires new token overrides.

### Trade-offs

- Token naming requires discipline.
- Legacy hardcoded colors must be migrated when touched.
- The theme service is a deliberate DOM-aware infrastructure exception.

## Alternatives considered

### Add a class to every component

This duplicates state and styling logic and makes new components easy to miss.

### Use a body-level `dark` class

A generic class is less explicit, collides more easily, and does not scale as
cleanly to font-size, contrast, and motion attributes.

### Store colors in JavaScript

This would move presentation into JavaScript and prevent CSS from resolving the
cascade efficiently.
