import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const UI_ROOT = join(process.cwd(), "src", "components", "ui");
const PUBLIC_COMPONENTS = [
    "Avatar",
    "Badge",
    "Button",
    "Card",
    "Checkbox",
    "Divider",
    "Dropdown",
    "Field",
    "IconButton",
    "Input",
    "Menu",
    "Modal",
    "SearchInput",
    "Select",
    "Spinner",
    "Switch",
    "Tabs",
    "Textarea",
    "Tooltip"
];

test("every public UI component is self-contained and default-exported", async () => {
    for (const name of PUBLIC_COMPONENTS) {
        const directory = join(UI_ROOT, name);
        const [component, stylesheet, unitTest, index] = await Promise.all([
            readFile(join(directory, `${name}.jsx`), "utf8"),
            readFile(join(directory, `${name}.module.css`), "utf8"),
            readFile(join(directory, `${name}.test.jsx`), "utf8"),
            readFile(join(directory, "index.js"), "utf8")
        ]);

        assert.match(component, /export default|export\s*\{\s*default\s*\}/);
        assert.ok(stylesheet.length > 0, `${name} requires component styles`);
        assert.match(unitTest, /\btest\(/);
        assert.match(index, /export \{ default \}/);
    }
});

test("UI components stay independent from application domains and Firebase", async () => {
    for (const name of PUBLIC_COMPONENTS) {
        const source = await readFile(
            join(UI_ROOT, name, `${name}.jsx`),
            "utf8"
        );

        assert.doesNotMatch(source, /firebase|firestore/i);
        assert.doesNotMatch(source, /services\/|hooks\/useAuth|context\/Auth/i);
    }
});

test("design tokens define semantic control geometry and color contracts", async () => {
    const tokens = await readFile(
        join(process.cwd(), "src", "styles", "themes", "theme-tokens.css"),
        "utf8"
    );

    for (const token of [
        "--control-height-sm",
        "--control-height-md",
        "--control-height-lg",
        "--on-primary",
        "--overlay"
    ]) {
        assert.match(tokens, new RegExp(token));
    }
});

test("Vite exposes the documented source alias", async () => {
    const viteConfig = await readFile(
        join(process.cwd(), "vite.config.js"),
        "utf8"
    );
    const jsConfig = await readFile(
        join(process.cwd(), "jsconfig.json"),
        "utf8"
    );

    assert.match(viteConfig, /"@"\s*:\s*resolve\(process\.cwd\(\), "src"\)/);
    assert.match(jsConfig, /"@\/\*"/);
});
