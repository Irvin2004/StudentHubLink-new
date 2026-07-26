import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
    return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("release packaging uses tracked files and excludes generated or secret data", async () => {
    const packageJson = JSON.parse(await read("package.json"));
    const script = await read("scripts/create-release-archive.mjs");
    const gitignore = await read(".gitignore");

    assert.equal(
        packageJson.scripts["release:archive"],
        "node scripts/create-release-archive.mjs"
    );
    assert.match(script, /\["ls-files", "-z"\]/);
    assert.doesNotMatch(script, /ls-files", "-co"/);
    assert.match(script, /fileName\.startsWith\("\.env\."\)/);
    assert.match(script, /rmSync\(archivePath, \{ force: true \}\)/);
    assert.doesNotMatch(script, /rmSync\(outputDirectory/);
    assert.match(gitignore, /^release\/$/m);
});

test("CI runs the canonical quality gate for every pull request", async () => {
    const workflow = await read(".github/workflows/ci.yml");

    assert.match(workflow, /^\s{4}pull_request:\s*$/m);
    assert.match(workflow, /run: npm run check/);
    assert.match(workflow, /cancel-in-progress: true/);
});
