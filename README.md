# StudentHub

> A student collaboration platform for communities, real-time messaging,
> academic resource sharing, and study productivity.

[![Status](https://img.shields.io/badge/status-production%20readiness-2563eb)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-passing-16a34a)](test)
[![License: MIT](https://img.shields.io/badge/license-MIT-0f766e.svg)](LICENSE)

StudentHub brings the tools students use every day into one accessible,
responsive web application. Students can discover and share academic resources,
join study communities, communicate in real time, and manage their learning
preferences without moving between disconnected platforms.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Firebase setup](#firebase-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Accessibility](#accessibility)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Features

### Communities and study groups

- Create, discover, and join student communities
- Manage members and community details
- Share group resources
- Create and track group assignments
- View community activity and notifications

### Real-time messaging

- Direct and group conversations
- Message replies and original-message navigation
- Emoji reactions
- Read receipts and typing indicators
- Voice messages and file attachments
- Conversation search, pinning, muting, and archiving
- Online presence

### Academic resources

- Upload and discover study material
- Search, filter, and sort resources
- Preview and download shared files
- Save favorites to a personal library
- Review, rate, and discuss resources
- Admin approval workflow

### Personal experience

- Student profiles and connections
- Light, dark, and system themes
- Notification preferences
- Adjustable font size
- Reduced-motion and high-contrast modes
- Responsive desktop, tablet, and mobile layouts
- Keyboard and screen-reader support

## Technology

- HTML5 and modular CSS
- Browser-native JavaScript ES modules
- Vite development and multi-page production builds
- ESLint, Prettier, Husky, and lint-staged
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Functions
- Node.js test runner
- Firebase Security Rules

StudentHub uses React with Vite, React Router, focused contexts, and modular
Firebase services. Existing browser-native feature pages are being migrated
route by route to preserve product behavior during the transition. Vite resolves
npm dependencies, provides environment variables, and creates the production
bundle.

## Architecture

StudentHub uses a layered architecture with explicit responsibility boundaries:

```text
Page entrypoint
      |
      v
Controller -----> Renderer -----> Reusable component
      |
      v
Service
      |
      v
Model / Firebase
```

- **Controllers** coordinate state, services, renderers, and lifecycle cleanup.
- **Services** own persistence, network access, and domain operations.
- **Models** validate and normalize domain data.
- **Renderers** update presentation without fetching or saving data.
- **Components** provide reusable interface behavior.
- **Utilities** provide pure, application-independent helpers where possible.

Stateful controllers and components use a consistent `initialize()` and
`destroy()` lifecycle. Services do not touch the DOM, and renderers do not
import Firebase.

See [the architecture guide](ARCHITECTURE.md) for the complete dependency,
naming, lifecycle, error-handling, and CSS standards.

## Project structure

```text
StudentHub/
|-- Admin/                 Admin-facing pages
|-- assets/                Logos and static media
|-- css/
|   |-- base/              Reset, typography, tokens, and utilities
|   |-- components/        Reusable component styles
|   |-- layout/            Shared responsive layout
|   |-- pages/             Page-specific styles
|   `-- themes/            Theme tokens and theme overrides
|-- docs/                  Architecture and operational documentation
|-- functions/             Firebase Cloud Functions
|-- js/
|   |-- components/        Reusable UI primitives
|   |-- config/            Frozen constants and configuration
|   |-- controllers/       UI and domain-flow coordination
|   |-- events/            Domain event contracts
|   |-- firebase/          Firebase initialization
|   |-- models/            Validation and normalization
|   |-- pages/             Page entrypoints
|   |-- renderers/         Presentation-only rendering
|   |-- services/          Persistence and domain operations
|   `-- utils/             Shared helpers
|-- pages/                 Application HTML pages
|-- scripts/               Repository checks
|-- test/                  Automated tests
|-- firebase.json          Firebase deployment configuration
|-- firestore.rules        Firestore authorization rules
|-- storage.rules          Storage authorization rules
`-- index.html             Public landing page
```

## Getting started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js 20 or newer](https://nodejs.org/)
- npm
- A Firebase project for authenticated and persistent features

### Installation

Clone the repository:

```bash
git clone https://github.com/Irvin2004/StudentHubLink-new.git
cd StudentHubLink-new
```

Install the exact locked application and Cloud Functions dependencies:

```bash
npm ci
npm --prefix functions ci
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add the Firebase web configuration for your development project, then start
Vite:

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Firebase setup

StudentHub uses Firebase Authentication, Firestore, Storage, and Cloud
Functions. To use your own Firebase project:

1. Create a Firebase project and register a web application.
2. Enable the authentication providers required by your deployment.
3. Create a Firestore database.
4. Enable Firebase Storage.
5. Copy `.env.example` to `.env.local` and keep deployment configuration out of
   version control.
6. Provide every required `VITE_FIREBASE_*` value.
7. Restrict the Firebase web API key and deploy the repository's Firestore and
   Storage rules.

Firebase Storage requires a one-time console initialization before its rules can
be deployed. In **Firebase Console → Build → Storage**, click **Get started**
for the same project configured in `.firebaserc`, complete the bucket setup, and
then deploy `storage.rules`. See the [deployment guide](docs/DEPLOYMENT.md) for
the release-safe sequence.

Vite validates Firebase configuration through `src/config/environment.js`.
Firebase initialization is split across `src/firebase/app.js`, `auth.js`,
`firestore.js`, and `storage.js`. Firebase web configuration identifies a
project but is not a substitute for Authentication, Security Rules, App Check,
or API-key restrictions. Never place service-account credentials in frontend
code.

Install and authenticate the Firebase CLI:

```bash
npm install --global firebase-tools
firebase login
firebase use --add
```

Deploy database indexes and security rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Cloud Functions may require a billing-enabled Firebase project:

```bash
firebase deploy --only functions
```

For collections, document relationships, and authorization expectations, read
the [Firestore schema](docs/firestore-schema.md).

## Testing

Run the automated test suite:

```bash
npm test
```

Run syntax validation and all tests together:

```bash
npm run check
```

Run individual quality checks:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

The current suite covers architecture boundaries, models, reusable components,
performance utilities, responsive behavior, messaging primitives, skeleton
states, empty states, and centralized error handling.

GitHub Actions runs linting, formatting checks, tests, and a production build.
Husky and lint-staged check staged files before local commits. Browser
end-to-end tests remain a production-readiness task.

## Deployment

The repository includes Firebase configuration for Firestore rules, indexes,
Storage rules, and Cloud Functions. Review the
[deployment guide](docs/DEPLOYMENT.md) before deploying.

`firebase.json` publishes `dist/` to Firebase Hosting. The deployment workflow
is manual and requires the documented GitHub environment secrets.

The authenticated React application uses `/app` as its route namespace. The
canonical resources URL is `/app/resources`; older `/app/files` and `/resources`
links redirect there while preserving deep-link query parameters. Community root
URLs redirect to their `general` channel. Firebase Hosting's catch-all rewrite
serves `index.html` so these client routes also work after a hard refresh.

## Accessibility

StudentHub includes:

- Semantic controls and accessible labels
- Visible keyboard focus
- Keyboard-operable menus and dialogs
- Screen-reader live regions
- High-contrast mode
- Reduced-motion support
- Adjustable global font sizing
- Responsive touch targets and layouts

Accessibility is an ongoing requirement. Changes to interactive components
should be tested with a keyboard and, where practical, a screen reader.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Architecture decisions](docs/decisions/README.md)
- [Setup](docs/setup.md)
- [Folder structure](docs/folder-structure.md)
- [Firebase](docs/firebase.md)
- [Service API](docs/API.md)
- [Firestore schema](docs/firestore-schema.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](SECURITY.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Roadmap](docs/roadmap.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Roadmap

The current production-readiness baseline includes:

- locked, reproducible dependency installs with `npm ci`
- a single `npm run check` release gate for lint, formatting, syntax, tests, and
  the production build
- deny-by-default Firestore and Storage rules with owner-scoped private writes
- canonical React routes with compatibility redirects for retired URLs
- responsive layouts and touch targets on mobile-critical study and social
  screens

Browser end-to-end coverage and a structured student beta remain release
follow-ups.

Future product work includes richer message editing, drag-and-drop uploads,
calendar and poll features, collaborative documents, and study-room tools.

See the [project roadmap](docs/roadmap.md) and [changelog](CHANGELOG.md) for
more detail.

## Contributing

Contributions are welcome. Before opening a pull request:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Create a focused branch.
3. Follow the architecture and naming standards.
4. Add or update tests for behavioral changes.
5. Run `npm run check`.
6. Describe the user impact and verification performed.

## Security

Do not report vulnerabilities in public issues. Follow the private reporting
process in the [security policy](SECURITY.md).

## License

StudentHub is available under the [MIT License](LICENSE).

## Author

Developed by **Amogelang Shogole**, Software Engineering student at False Bay
College.

If StudentHub is useful to you, consider starring the repository or contributing
an improvement.
