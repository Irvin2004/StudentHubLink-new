# Folder structure

StudentHub is migrating incrementally into a Vite `src/` boundary. Existing
`js/` and `css/` modules remain active until each move can be reviewed with its
imports and tests.

```text
StudentHub/
|-- .github/              CI, deployment, and repository templates
|-- .husky/               Local Git hooks
|-- Admin/                Admin HTML entries
|-- assets/               Existing static branding and media
|-- css/                  Existing layered styles
|-- docs/                 Technical and contributor documentation
|-- functions/            Firebase Cloud Functions
|-- js/                   Existing application modules
|-- pages/                Application HTML entries
|-- scripts/              Repository validation
|-- src/
|   |-- config/           Vite environment validation
|   |-- firebase/         Firebase SDK instances
|   |-- styles/           Vite CSS entrypoint
|   |-- routes/           React route definitions and route guards
|   |-- context/          Focused application-wide state
|   |-- hooks/            Reusable React behavior
|   |-- App.jsx           Provider and router composition
|   `-- main.jsx          React application bootstrap
|-- test/                 Node automated tests
|-- firebase.json         Firebase deployment targets
|-- eslint.config.js      ESLint flat configuration
|-- package.json          Dependencies and commands
`-- vite.config.js        Multi-page development and build configuration
```

## Target source layout

```text
src/
|-- assets/
|   |-- fonts/
|   |-- icons/
|   `-- images/
|-- components/
|-- config/
|-- controllers/
|-- firebase/
|-- models/
|-- pages/
|-- renderers/
|-- services/
|-- styles/
|   |-- base/
|   |-- components/
|   |-- layout/
|   |-- themes/
|   `-- utilities/
|-- utils/
|-- routes/
|-- context/
|-- hooks/
|-- App.jsx
`-- main.jsx
```

New work must not create duplicate implementations in both the old and target
locations. A migration moves one coherent module set, updates every import and
test, and removes the replaced source in the same change.

See [`ARCHITECTURE.md`](../ARCHITECTURE.md) for layer responsibilities and
[`src/README.md`](../src/README.md) for the migration boundary.
