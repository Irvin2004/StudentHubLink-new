import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Firestore and Storage rules remain deny-by-default", () => {
    const firestore = read("firestore.rules");
    const storage = read("storage.rules");

    assert.match(
        firestore,
        /match \/\{document=\*\*\} \{\s*allow read, write: if false;/
    );
    assert.match(
        storage,
        /match \/\{allPaths=\*\*\} \{\s*allow read, write: if false;/
    );
});

test("unapproved resources and favorite writes are owner-scoped", () => {
    const rules = read("firestore.rules");

    assert.match(rules, /resource\.data\.approved == true/);
    assert.match(rules, /resource\.data\.ownerId == request\.auth\.uid/);
    assert.match(rules, /match \/favorites\/\{favoriteId\}/);
    assert.match(rules, /allow update: if false;/);
    assert.match(
        rules,
        /request\.resource\.data\.resourceKey\s*== request\.resource\.data\.resourceId/
    );
});

test("uploaded resources and profile images can only be deleted by owners", () => {
    const rules = read("storage.rules");

    for (const path of ["resources", "profiles"]) {
        const start = rules.indexOf(`match /${path}/{userId}/{fileName}`);
        assert.notEqual(start, -1);
        const block = rules.slice(start, start + 650);
        assert.match(block, /allow delete: if signedIn\(\)/);
        assert.match(block, /request\.auth\.uid == userId/);
    }
});
