# Deployment

## Overview

StudentHub is designed to deploy on Firebase.

## Frontend

Frontend hosting target:

- Firebase Hosting

Current frontend stack:

- Static HTML
- CSS
- JavaScript ES Modules

## Backend

Backend services:

- Firebase Cloud Functions
- Cloud Firestore
- Firebase Authentication
- Firebase Storage planned

## Requirements

- Node.js
- npm
- Firebase CLI
- Firebase project access
- Blaze plan for Cloud Functions deployment

## Install Firebase CLI

```powershell
npm install -g firebase-tools
```

## Login

```powershell
firebase login
```

## Select Project

```powershell
firebase use studenthub-c9bc0
```

## Deploy Firestore Rules

```powershell
firebase deploy --only firestore:rules
```

## Install Functions Dependencies

```powershell
cd functions
npm install
```

## Deploy Functions

Cloud Functions require the Blaze pay-as-you-go plan.

```powershell
firebase deploy --only functions
```

## Local Frontend Preview

Serve the project over HTTP because JavaScript modules do not work reliably from direct file access.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/index.html
```

## Deployment Notes

- Firestore rules are live for `studenthub-c9bc0`.
- Functions are prepared locally but should not be deployed until the project is upgraded to Blaze.
- Frontend workflows should avoid direct writes to derived backend-owned fields.
