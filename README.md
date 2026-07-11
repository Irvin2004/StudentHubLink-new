# StudentHub

StudentHub is a student resource platform for discovering, uploading, reviewing, purchasing, and downloading academic resources. The project currently runs as a static HTML/CSS/JavaScript app backed by Firebase Authentication, Cloud Firestore, and Firebase Storage.

## Features

- Student registration and login with Firebase Authentication
- Role-based student and admin flows
- Marketplace for approved study resources
- Upload workflow with admin review
- Resource download and purchase tracking
- User library for accessed resources
- Dashboard stats, recent activity, notifications, and analytics
- Admin dashboard for pending resource approvals and platform metrics

## Latest Features (v1.1)

- 🔍 Smart Search
- 🏷️ Category & Price Filters
- ↕️ Sorting
- ❤️ Favorites
- 🌙 Dark Mode
- 🏆 Achievements
- 📊 Dashboard Analytics
- 🥇 Leaderboards

## Tech Stack

- HTML, CSS, and JavaScript modules
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Chart.js for dashboard analytics

## Project Structure

```text
StudentHub/
├── Admin/
├── assets/
├── css/
│   ├── base/
│   ├── components/
│   └── pages/
├── docs/
│   ├── architecture.md
│   ├── firestore-schema.md
│   └── roadmap.md
├── js/
│   ├── service/
│   └── utils/
├── pages/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── .gitignore
```

## Running Locally

Because the app uses JavaScript modules, serve the project over HTTP instead of opening files directly.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

## Documentation

- [Architecture](docs/architecture.md)
- [Firestore Schema](docs/firestore-schema.md)
- [Roadmap](docs/roadmap.md)
- [Contributing](CONTRIBUTING.md)

## Status

StudentHub is under active development. See [CHANGELOG.md](CHANGELOG.md) for notable changes and [docs/roadmap.md](docs/roadmap.md) for planned work.

## Author

Amogelang Shogole
