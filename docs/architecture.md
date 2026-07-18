# StudentHub Architecture

## Overview

StudentHub is a modular web application built with Firebase.

The application follows a layered architecture that separates user interface components from business logic and backend services. The frontend displays data and handles interactions, while Firebase and Cloud Functions own persistence, authentication, authorization, and sensitive business logic.

## Frontend

- HTML5
- CSS3
- JavaScript ES Modules

## Frontend Structure

```text
Pages
  -> Controllers
  -> Renderers
  -> Components
  -> Services
  -> Firebase
```

## Key Frontend Folders

- `pages/`: route-level screens such as marketplace, library, profile, resource details, and chat.
- `css/`: base theme styles, component styles, and page-specific layouts.
- `js/components/`: reusable UI fragments such as resource cards, rating stars, review cards, comment cards, and message bubbles.
- `js/controllers/`: user interaction handlers such as review forms, comments, favorites, and chat.
- `js/pages/`: route bootstraps that connect a page's DOM to controllers and services.
- `js/renderers/`: data-to-UI rendering modules.
- `js/services/`: Firebase access and business-facing service modules.
- `js/utils/`: shared helpers for DOM, formatting, errors, logging, and constants.

## Backend

StudentHub uses Firebase as the backend platform.

- Firebase Authentication
- Cloud Firestore
- Cloud Functions
- Firebase Storage planned
- Firebase Hosting planned

## Backend Structure

```text
functions/
  index.js
  config/
  reviews/
  achievements/
  notifications/
  analytics/
  chat/
  users/
  utils/
```

## Current Backend Flow

Reviews are now backend-owned for rating aggregation:

```text
Add Review
  -> Firestore reviews collection
  -> Cloud Function updateResourceRating
  -> Firestore resources averageRating/reviewCount
  -> Frontend displays updated resource data
```

## Design Principles

- Component-based UI
- Service-oriented business logic
- Reusable utilities
- Separation of concerns
- Real-time updates
- Backend-owned sensitive logic
- Secure Firestore rules by default
