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
    const searchBar = await read(
        "src/components/Search/SearchBar/SearchBar.jsx"
    );
    const topbar = await read("src/components/layout/Topbar/Topbar.jsx");

    assert.match(app, /<SearchProvider>/);
    assert.match(app, /<DeferredSearchModal \/>/);
    assert.match(app, /const SearchModal = lazy/);
    assert.match(app, /<SearchModal onClose=\{closeSearch\} open=\{isOpen\}/);
    assert.match(provider, /export function SearchProvider/);
    assert.match(provider, /const SEARCH_DELAY = 300/);
    assert.match(provider, /const resultCache = new Map/);
    assert.match(provider, /groupSearchResults/);
    assert.match(provider, /performSearch/);
    assert.match(provider, /selectNext/);
    assert.match(provider, /selectPrevious/);
    assert.match(provider, /openResult/);
    assert.match(provider, /isEditableTarget/);
    assert.match(topbar, /<SearchBar/);
    assert.match(topbar, /onChange=\{updateSearch\}/);
    assert.match(topbar, /value=\{query\}/);
    assert.doesNotMatch(topbar, /firebase|firestore|search-service/);
    assert.match(searchBar, /onChange\(event\.target\.value\)/);
    assert.doesNotMatch(
        searchBar,
        /useSearch|firebase|firestore|search-service/
    );
    assert.match(hook, /useContext\(SearchContext\)/);
    assert.match(hook, /useSearch must be used inside SearchProvider/);
    assert.doesNotMatch(hook, /useState|useEffect|debounce|resultCache/);
});

test("global search executes bounded parallel prefix queries", async () => {
    const service = await read("src/services/search-service.js");
    const communityAdapter = await read(
        "src/adapters/community-search-adapter.js"
    );
    const channelAdapter = await read("src/adapters/channel-search-adapter.js");
    const fileAdapter = await read("src/adapters/file-search-adapter.js");

    assert.match(service, /Promise\.all/);
    assert.match(service, /collectionGroup\(db, CHANNELS\)/);
    assert.match(service, /collectionGroup\(db, FILES\)/);
    assert.match(service, /orderBy\(field\)/);
    assert.match(service, /endAt\(`\$\{term\}\\uf8ff`\)/);
    assert.match(service, /where\(field, "array-contains", term\)/);
    assert.match(service, /const RESULT_LIMIT = 5/);
    assert.match(service, /const GLOBAL_RESULT_LIMIT = 15/);
    assert.match(service, /Unable to search StudentHub\./);
    assert.match(communityAdapter, /type: "community"/);
    assert.match(channelAdapter, /type: "channel"/);
    assert.match(fileAdapter, /type: "file"/);
});

test("global search provides keyboard and accessible modal behavior", async () => {
    const provider = await read("src/context/SearchContext.jsx");
    const modal = await read(
        "src/components/Search/SearchModal/SearchModal.jsx"
    );
    const results = await read(
        "src/components/Search/SearchResults/SearchResults.jsx"
    );

    assert.match(provider, /event\.ctrlKey \|\| event\.metaKey/);
    assert.match(provider, /event\.key\.toLowerCase\(\) === "k"/);
    assert.match(modal, /event\.key === "ArrowDown"/);
    assert.match(modal, /event\.key === "ArrowUp"/);
    assert.match(modal, /event\.key === "Enter"/);
    assert.match(modal, /role="combobox"/);
    assert.match(modal, /<SearchBar/);
    assert.match(results, /role="listbox"/);
    assert.match(results, /No results found\./);
    assert.match(results, /Unable to search StudentHub\./);
    assert.match(results, /<SearchResultSkeleton/);
});
