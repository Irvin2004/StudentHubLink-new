# Firebase integration

StudentHub uses the Firebase npm SDK through Vite.

## Frontend modules

```text
src/firebase/
|-- app.js          Initialize the Firebase application once
|-- auth.js         Export Authentication with local persistence
|-- firestore.js    Export Cloud Firestore
|-- storage.js      Export Firebase Storage
`-- index.js        Public entry for Firebase instances
```

`src/config/environment.js` reads and validates the public web configuration.
Services import the Firebase instances they need from `src/firebase/index.js`.
React components, pages, contexts, hooks, and routes never import Firebase
directly.

## Authentication lifecycle

`src/services/auth-service.js` owns Authentication SDK calls for login,
registration, logout, password reset, profile updates, and auth-state
subscriptions. `AuthProvider` consumes that service and exposes the current
user, loading state, and auth actions through `useAuth()`.

Authentication uses `browserLocalPersistence`, so sessions survive a browser
restart. Route guards remain on their loading screen until Firebase reports the
initial session:

```text
Application start -> restore session -> ProtectedRoute or GuestRoute
```

Registration creates `users/{uid}` with normalized identity fields, a student
role, timestamps, and default theme settings. Updates preserve `createdAt`.

## Environment variables

| Variable                            | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase web API identifier               |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Authentication domain                     |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project identifier               |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Storage bucket                            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender identifier               |
| `VITE_FIREBASE_APP_ID`              | Firebase web application identifier       |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Optional Analytics measurement identifier |

Service-account credentials never belong in these variables because Vite embeds
them in the browser bundle.

## Data access

Domain reads and writes belong in `js/services/` while the incremental `src/`
migration is underway. Services:

- import `auth`, `db`, or `storage` through `src/firebase/index.js`;
- validate domain preconditions;
- keep queries bounded;
- return data or unsubscribe functions; and
- throw errors rather than rendering feedback.

Presentation modules do not import Firebase.

## Security

- `firestore.rules` authorizes document operations.
- `storage.rules` authorizes files, sizes, MIME types, and paths.
- `firestore.indexes.json` defines required compound indexes.
- Cloud Functions own trusted derived-data workflows.

Client validation is not enforcement. Review rules whenever a collection, field,
membership rule, role, or storage path changes.

## Deployment

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete release process and
[firestore-schema.md](firestore-schema.md) for document relationships.
