import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { getFirebaseEnvironment } from "../src/config/environment.js";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function filesIn(path, extension) {
    const directory = new URL(`../${path}/`, import.meta.url);

    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const relative = `${path}/${entry.name}`;

        if (entry.isDirectory()) {
            return filesIn(relative, extension);
        }

        return entry.isFile() && entry.name.endsWith(extension)
            ? [relative.replaceAll("\\", "/")]
            : [];
    });
}

test("Firebase environment validation returns a complete immutable config", () => {
    const environment = {
        VITE_FIREBASE_API_KEY: "test-key",
        VITE_FIREBASE_AUTH_DOMAIN: "studenthub.test",
        VITE_FIREBASE_PROJECT_ID: "studenthub-test",
        VITE_FIREBASE_STORAGE_BUCKET: "studenthub-test.appspot.test",
        VITE_FIREBASE_MESSAGING_SENDER_ID: "123",
        VITE_FIREBASE_APP_ID: "app-123",
        VITE_FIREBASE_MEASUREMENT_ID: "measurement-123"
    };
    const config = getFirebaseEnvironment(environment);

    assert.deepEqual(config, {
        apiKey: "test-key",
        authDomain: "studenthub.test",
        projectId: "studenthub-test",
        storageBucket: "studenthub-test.appspot.test",
        messagingSenderId: "123",
        appId: "app-123",
        measurementId: "measurement-123"
    });
    assert.equal(Object.isFrozen(config), true);
});

test("Firebase environment validation reports every required missing value", () => {
    assert.throws(
        () => getFirebaseEnvironment({}),
        (error) => {
            assert.match(error.message, /VITE_FIREBASE_API_KEY/);
            assert.match(error.message, /VITE_FIREBASE_PROJECT_ID/);
            assert.match(error.message, /VITE_FIREBASE_APP_ID/);
            return true;
        }
    );
});

test("frontend Firebase modules use the npm SDK without committed values", () => {
    const javascript = [...filesIn("src", ".js")].map(read).join("\n");
    const appModule = read("src/firebase/app.js");
    const environmentExample = read(".env.example");

    assert.doesNotMatch(javascript, /gstatic\.com\/firebasejs/);
    assert.match(appModule, /from "firebase\/app"/);
    assert.match(appModule, /getFirebaseEnvironment/);
    assert.match(environmentExample, /VITE_FIREBASE_API_KEY=/);
    assert.doesNotMatch(environmentExample, /AIza[0-9A-Za-z_-]+/);
});

test("Firebase products expose focused modules through one public entry", () => {
    const firebaseIndex = read("src/firebase/index.js");
    const authModule = read("src/firebase/auth.js");

    assert.match(firebaseIndex, /export \{ app, firebaseConfig \}/);
    assert.match(firebaseIndex, /export \{ auth, initializeAuthPersistence \}/);
    assert.match(firebaseIndex, /export \{ db \}/);
    assert.match(firebaseIndex, /export \{ storage \}/);
    assert.match(authModule, /browserLocalPersistence/);
    assert.match(authModule, /setPersistence\(auth, browserLocalPersistence\)/);
});

test("React authentication foundation exposes the complete service API", () => {
    const authService = read("src/services/auth-service.js");
    const profileService = read("src/services/user-profile-service.js");
    const protectedRoute = read("src/routes/ProtectedRoute.jsx");
    const guestRoute = read("src/routes/GuestRoute.jsx");

    for (const publicFunction of [
        "login",
        "register",
        "logout",
        "resetPassword",
        "onAuthStateChanged",
        "updateProfile"
    ]) {
        assert.match(
            authService,
            new RegExp(`export (?:async )?function ${publicFunction}\\(`)
        );
    }

    assert.match(profileService, /createUserProfileDocument/);
    assert.match(profileService, /updateUserProfileDocument/);
    assert.match(protectedRoute, /<Navigate to=\{ROUTES\.LOGIN\}/);
    assert.match(guestRoute, /<Navigate to=\{ROUTES\.DASHBOARD\}/);
});

test("React presentation modules never import Firebase directly", () => {
    const presentationFolders = [
        "src/components",
        "src/context",
        "src/hooks",
        "src/pages",
        "src/routes"
    ];

    for (const folder of presentationFolders) {
        const sourceFiles = [
            ...filesIn(folder, ".js"),
            ...filesIn(folder, ".jsx")
        ];

        for (const path of sourceFiles) {
            const source = read(path);

            assert.doesNotMatch(
                source,
                /from\s+["']firebase(?:\/|["'])/,
                `${path} must use a service instead of the Firebase SDK`
            );
            assert.doesNotMatch(
                source,
                /from\s+["'][^"']*\/firebase(?:\/|["'])/,
                `${path} must use a service instead of a Firebase module`
            );
        }
    }
});

test("the React SPA has one canonical HTML and JavaScript entry", () => {
    const source = read("index.html");
    const vite = read("vite.config.js");

    assert.match(
        source,
        /<script type="module" src="\/src\/main\.jsx"><\/script>/
    );
    assert.doesNotMatch(source, /src\/main\.js["']|<link[^>]+href="[^"]*css\//);
    assert.doesNotMatch(vite, /findHtmlEntries|rollupOptions:\s*\{\s*input:/);
});

test("foundation tooling exposes deterministic quality commands", () => {
    const packageMetadata = JSON.parse(read("package.json"));

    for (const command of [
        "dev",
        "build",
        "lint",
        "format",
        "format:check",
        "test",
        "check",
        "prepare"
    ]) {
        assert.equal(
            typeof packageMetadata.scripts[command],
            "string",
            `Missing npm script: ${command}`
        );
    }

    for (const dependency of [
        "firebase",
        "react",
        "react-dom",
        "react-router-dom"
    ]) {
        assert.equal(
            typeof packageMetadata.dependencies[dependency],
            "string",
            `Missing runtime dependency: ${dependency}`
        );
    }

    for (const dependency of [
        "vite",
        "vitest",
        "eslint",
        "prettier",
        "husky",
        "lint-staged",
        "@eslint/js",
        "globals",
        "@testing-library/react",
        "@testing-library/jest-dom"
    ]) {
        assert.equal(
            typeof packageMetadata.devDependencies[dependency],
            "string",
            `Missing development dependency: ${dependency}`
        );
    }
});

test("CI and deployment workflows run through committed configuration", () => {
    const ci = read(".github/workflows/ci.yml");
    const deploy = read(".github/workflows/deploy.yml");
    const firebase = JSON.parse(read("firebase.json"));

    assert.match(ci, /npm ci/);
    assert.match(ci, /npm run check/);
    assert.match(deploy, /workflow_dispatch/);
    assert.match(deploy, /FIREBASE_SERVICE_ACCOUNT/);
    assert.equal(firebase.hosting.public, "dist");
});
