import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

async function read(path) {
    return readFile(join(ROOT, path), "utf8");
}

test("React empty states use one reusable accessible component", async () => {
    const component = await read("src/components/EmptyState/EmptyState.jsx");
    const styles = await read(
        "src/components/EmptyState/EmptyState.module.css"
    );

    assert.match(component, /aria-labelledby=\{titleId\}/);
    assert.match(component, /actionLabel/);
    assert.match(component, /illustration/);
    assert.match(component, /aria-hidden="true"/);
    assert.match(styles, /var\(--surface\)/);
    assert.match(styles, /var\(--text\)/);
    assert.match(styles, /@media \(max-width:/);
});

test("common empty-state illustrations are committed", async () => {
    await Promise.all(
        ["communities", "search", "files", "notifications"].map((name) =>
            access(
                join(
                    ROOT,
                    "src",
                    "components",
                    "EmptyState",
                    "illustrations",
                    `${name}.svg`
                )
            )
        )
    );
});

test("primary async views compose the shared empty state", async () => {
    const files = await Promise.all(
        [
            "src/components/communities/CommunityGrid/CommunityGrid.jsx",
            "src/components/Search/SearchResults/SearchResults.jsx",
            "src/components/files/FileList/FileList.jsx",
            "src/components/chat/MessageList/MessageList.jsx",
            "src/pages/notifications/NotificationsPage.jsx"
        ].map(read)
    );

    files.forEach((source) => {
        assert.match(source, /EmptyState/);
        assert.doesNotMatch(source, /className=\{styles\.empty\}/);
    });
});
