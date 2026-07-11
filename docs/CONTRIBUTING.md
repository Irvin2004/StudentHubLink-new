# Contributing

StudentHub uses a simple professional workflow so changes stay organized.

## Branch Naming

Use clear branch prefixes:

- `feature/`
- `bugfix/`
- `hotfix/`
- `docs/`
- `refactor/`

Examples:

```text
feature/messaging-system
bugfix/review-form-validation
docs/project-handbook
```

## Commit Format

Use short conventional commit-style prefixes:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `test:`
- `chore:`

Examples:

```text
feat: add real-time chat messages
fix: prevent users from changing roles
docs: add deployment guide
```

## Workflow

1. Create a branch.
2. Develop the feature or fix.
3. Test locally.
4. Review changed files.
5. Open a pull request.
6. Merge after review.

## Coding Guidelines

- Keep components reusable.
- Keep controllers focused on user interactions.
- Keep services focused on data access and business-facing operations.
- Move sensitive logic to Cloud Functions.
- Prefer small, focused changes.
- Document new collections, services, and deployment steps.

## Testing Checklist

- Page loads without console import errors.
- Auth-protected flows still redirect correctly.
- Firestore permission failures are expected and documented.
- Core user actions still complete.
- UI works on mobile and desktop widths.
