# Development setup

## Prerequisites

- Git
- Node.js 20 or newer
- npm
- a Firebase project for authenticated and persistent workflows

## Install

```bash
git clone https://github.com/Irvin2004/StudentHubLink-new.git
cd StudentHubLink-new
npm install
npm --prefix functions install
```

## Configure the environment

Copy the committed example:

```bash
cp .env.example .env.local
```

Provide:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Vite exposes only `VITE_`-prefixed values to browser code. `.env.local` and
other environment files are ignored by Git.

Firebase web identifiers are visible to users and are not authorization. Protect
the project with Authentication, Firestore and Storage Rules, API-key
restrictions, and App Check where appropriate. Never place service-account
credentials in a Vite environment variable.

## Run locally

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Vite serves every HTML entry in the repository, including root, `pages/`, and
`Admin/` routes.

## Quality commands

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm test
npm run build
npm run check
```

`npm run check` is the complete local and CI gate.

## Cloud Functions

```bash
npm --prefix functions run lint
npm --prefix functions run serve
```

The emulator command requires the Firebase CLI and a selected Firebase project.

## Common problems

### Missing Firebase environment variables

Copy `.env.example` to `.env.local`, fill every required value, and restart the
Vite server.

### Port 5173 is already in use

Stop the process using the port. Vite uses a strict port so documentation and
browser tests always target the same origin.

### Permission-denied errors

Confirm the signed-in account, Firebase project, document path, and deployed
Security Rules. Do not weaken a rule before verifying the intended authorization
model.

### Git commit is blocked

Husky runs lint-staged and tests. Run `npm run check`, correct the reported
failure, stage the fix, and commit again.
