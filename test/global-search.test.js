import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
    return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("global search is composed through context without presentation data access", async () => {
    const app = await read("src/App.jsx");
    const provider = await read("src/context/SearchContext.jsx");
    const hook = await read("src/hooks/useSearch.js");
    const topbar = await read("src/components/layout/Topbar/Topbar.jsx");

    assert.match(app, /<SearchProvider>/);
    assert.match(app, /<DeferredSearchModal \/>/);
    assert.match(app, /const SearchModal = lazy/);
    assert.match(provider, /useSearchController/);
    assert.match(topbar, /<SearchBar \/>/);
    assert.doesNotMatch(topbar, /firebase|firestore|search-service/);
    assert.match(hook, /const SEARCH_DELAY = 300/);
    assert.match(hook, /const MINIMUM_QUERY_LENGTH = 2/);
    assert.match(hook, /resultCache/);
    assert.match(hook, /requestIdRef/);
});

test("global search executes bounded parallel prefix queries", async () => {
    const service = await read("src/services/search-service.js");

    assert.match(service, /Promise\.all/);
    assert.match(service, /collectionGroup\(db, CHANNELS\)/);
    assert.match(service, /collectionGroup\(db, FILES\)/);
    assert.match(service, /orderBy\(field\)/);
    assert.match(service, /endAt\(`\$\{term\}\\uf8ff`\)/);
    assert.match(service, /limit\(resultLimit\(maxResults\)\)/);
});

test("global search provides keyboard and accessible modal behavior", async () => {
    const hook = await read("src/hooks/useSearch.js");
    const modal = await read(
        "src/components/Search/SearchModal/SearchModal.jsx"
    );
    const results = await read(
        "src/components/Search/SearchResults/SearchResults.jsx"
    );

    assert.match(hook, /event\.ctrlKey \|\| event\.metaKey/);
    assert.match(hook, /event\.key\.toLowerCase\(\) === "k"/);
    assert.match(modal, /event\.key === "ArrowDown"/);
    assert.match(modal, /event\.key === "ArrowUp"/);
    assert.match(modal, /event\.key === "Enter"/);
    assert.match(modal, /role="combobox"/);
    assert.match(results, /role="listbox"/);
    assert.match(results, /No results found\./);
    assert.match(results, /Couldn&apos;t search\./);
    assert.match(results, /<Skeleton/);
});
