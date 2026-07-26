import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function filesIn(path) {
    const directory = new URL(`../${path}/`, import.meta.url);

    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const relative = `${path}/${entry.name}`;

        return entry.isDirectory()
            ? filesIn(relative)
            : [relative.replaceAll("\\", "/")];
    });
}

function readMany(paths) {
    return paths.map((path) => read(path)).join("\n");
}

test("Firebase configuration has one canonical location", () => {
    assert.equal(
        existsSync(new URL("../src/firebase/app.js", import.meta.url)),
        true
    );
    assert.equal(
        existsSync(
            new URL("../js/firebase/firebase-config.js", import.meta.url)
        ),
        false
    );
    assert.equal(
        existsSync(new URL("../src/firebase/auth.js", import.meta.url)),
        true
    );
    assert.equal(
        existsSync(new URL("../src/firebase/firestore.js", import.meta.url)),
        true
    );
    assert.equal(
        existsSync(new URL("../src/firebase/storage.js", import.meta.url)),
        true
    );

    const source = readMany(
        [...filesIn("js"), ...filesIn("src")].filter((path) =>
            path.endsWith(".js")
        )
    );

    assert.doesNotMatch(source, /gstatic\.com\/firebasejs/);
    assert.doesNotMatch(source, /firebase-config\.js/);
});

test("presentation and model layers stay behind service boundaries", () => {
    const presentation = readMany(
        [
            ...filesIn("js/components"),
            ...filesIn("js/renderers"),
            ...filesIn("js/models"),
            ...filesIn("src/components"),
            ...filesIn("src/pages"),
            ...filesIn("src/models")
        ].filter((path) => /\.(?:js|jsx)$/.test(path))
    );

    assert.doesNotMatch(presentation, /from\s+["'][^"']*services\//);
    assert.doesNotMatch(
        presentation,
        /from\s+["'][^"']*(?:firebase\/|src\/firebase)/i
    );
    assert.doesNotMatch(presentation, /firestore/i);
});

test("utilities do not depend on application layers", () => {
    const utilities = readMany(
        [...filesIn("js/utils"), ...filesIn("src/utils")].filter((path) =>
            path.endsWith(".js")
        )
    );

    assert.doesNotMatch(
        utilities,
        /from\s+["'][^"']*(?:services|controllers|renderers)\//
    );
    assert.doesNotMatch(utilities, /firebase|firestore/i);
});

test("standard lifecycle spelling and centralized errors are enforced", () => {
    const sourceFiles = filesIn("js").filter((path) => path.endsWith(".js"));
    const source = readMany([
        ...sourceFiles,
        ...filesIn("src").filter((path) => path.endsWith(".js"))
    ]);
    const logger = read("js/utils/logger.js");
    const sourceWithoutLogger = source.replace(logger, "");

    assert.doesNotMatch(source, /\binitialise[A-Z]/);
    assert.doesNotMatch(source, /\bdispose\s*\(/);
    assert.doesNotMatch(source, /\balert\s*\(/);
    assert.doesNotMatch(sourceWithoutLogger, /console\.error\s*\(/);
});

test("JavaScript filenames use lowercase kebab-case", () => {
    const invalid = [...filesIn("js"), ...filesIn("src")]
        .filter((path) => path.endsWith(".js"))
        .map((path) => path.split("/").at(-1))
        .filter(
            (name) =>
                !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.test)?\.js$/.test(name) &&
                !/^use[A-Z][A-Za-z0-9]*\.js$/.test(name)
        );

    assert.deepEqual(invalid, []);
});
