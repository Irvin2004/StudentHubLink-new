# StudentHub

StudentHub is a Firebase-powered student resource platform for discovering, uploading, reviewing, discussing, saving, and sharing academic resources.

It is evolving from a resource marketplace into a collaborative study platform with reviews, comments, followers, messaging, achievements, analytics, and backend-owned business logic.

## Screenshots

Screenshots are planned for the project documentation. Recommended captures:

- Landing page
- Marketplace
- Resource details with reviews and comments
- Favorites
- Dashboard
- Chat

## Features

- Firebase Authentication
- Role-based student and admin flows
- Marketplace for approved study resources
- Upload workflow with admin review
- Smart Search
- Category and Price Filters
- Sorting
- Favorites
- Dark Mode
- Reviews and Ratings
- Resource discussion comments
- Real-time comments
- Mutual follow system
- Private messaging
- Real-time chat messages
- Typing indicators
- User library
- Notifications
- Achievements
- Dashboard Analytics
- Leaderboards
- Firestore Security Rules
- Cloud Functions architecture

## Latest Features

### v1.3

- Followers
- Mutual follow messaging
- Real-time chat
- Typing indicators
- Real-time discussions

### v1.2

- Reviews
- Ratings
- Comments
- Rating stars
- Dynamic review updates

### v1.1

- Smart Search
- Category and Price Filters
- Sorting
- Favorites
- Dark Mode
- Achievements
- Dashboard Analytics
- Leaderboards

## Technology Stack

- HTML5
- CSS3
- JavaScript ES Modules
- Firebase Authentication
- Cloud Firestore
- Cloud Functions
- Firebase Storage planned
- Firebase Hosting planned
- Chart.js

## Architecture Diagram

```text
Pages
  -> Controllers
  -> Renderers
  -> Components
  -> Services
  -> Firebase
  -> Cloud Functions
```

Backend business logic is moving into Cloud Functions so the frontend displays data while the backend owns sensitive updates.

## Project Structure

```text
StudentHub/
  Admin/
  assets/
  css/
  docs/
  functions/
  js/
    components/
    controllers/
    pages/
    renderers/
    services/
    utils/
  pages/
  firestore.rules
  firebase.json
  README.md
```

## Installation

Clone or open the project folder, then serve it over HTTP because the app uses JavaScript modules.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/index.html
```

## Firebase Setup

Install Firebase CLI:

```powershell
npm install -g firebase-tools
```

Login:

```powershell
firebase login
```

Deploy Firestore rules:

```powershell
firebase deploy --only firestore:rules
```

Cloud Functions require the Firebase Blaze plan before deployment.

## Documentation

- [Architecture](docs/architecture.md)
- [Firestore schema](docs/firestore-schema.md)
- [API](docs/API.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/roadmap.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Roadmap

- v1: Authentication, Marketplace, Uploads
- v1.1: Search, Favorites, Dark Mode
- v1.2: Reviews, Ratings, Comments
- v1.3: Followers, Messaging, Notifications
- v1.4: Backend-owned Cloud Functions workflows
- v2: AI Study Assistant, Flashcards, Quiz Generator

## License

StudentHub is licensed under the MIT License. See [LICENSE](LICENSE).

## Contact

Created by Amogelang Shogole.
