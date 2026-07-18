# Contributing to StudentHub

Thanks for helping make StudentHub better. This project is still small, so the contribution process is intentionally lightweight.

## Development Workflow

1. Pull the latest changes before starting work.
2. Create a focused branch for the change.
3. Keep edits scoped to the feature, fix, or documentation update.
4. Test the affected pages locally.
5. Update documentation when behavior, setup, or data structure changes.
6. Add a changelog entry under `Unreleased` for notable changes.

## Local Setup

Serve the project over HTTP so JavaScript modules load correctly:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/index.html
```

## Code Style

- Use plain JavaScript modules.
- Keep Firebase access inside `js/services/` modules.
- Keep page bootstrapping and DOM orchestration inside `js/pages/` or `js/controllers/`.
- Put reusable helpers in `js/utils/`.
- Keep CSS organized by base, components, and page-specific files.
- Prefer clear names over abbreviations.
- Avoid adding new global state unless there is a clear page-level need.

## Firestore Changes

When adding or changing Firestore collections or fields:

- Update `docs/firestore-schema.md`.
- Prefer `serverTimestamp()` for created/updated timestamps.
- Prefer `increment()` for counters.
- Keep collection and status names aligned with `js/utils/constants.js`.

## Pull Request Checklist

- The affected pages load over the local server.
- Browser console errors and warnings have been checked.
- JavaScript syntax checks pass for edited files.
- Documentation has been updated when needed.
- `CHANGELOG.md` includes a short entry under `Unreleased` for notable changes.
