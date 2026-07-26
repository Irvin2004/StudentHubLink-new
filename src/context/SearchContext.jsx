import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SearchContext } from "./search-context.js";
import { debounce } from "../utils/debounce.js";

const EMPTY_RESULTS = Object.freeze({
    channels: Object.freeze([]),
    communities: Object.freeze([]),
    files: Object.freeze([])
});
const FILTER_GROUPS = Object.freeze({
    all: null,
    channel: "channels",
    community: "communities",
    file: "files"
});
const SEARCH_DELAY = 300;
const MINIMUM_QUERY_LENGTH = 2;
const CACHE_DURATION = 2 * 60 * 1000;
const CACHE_LIMIT = 20;
const SEARCH_ERROR_MESSAGE = "Unable to search StudentHub.";
const resultCache = new Map();

function groupSearchResults(results) {
    if (!Array.isArray(results)) return results;

    return Object.freeze({
        channels: Object.freeze(
            results.filter(({ type }) => type === "channel")
        ),
        communities: Object.freeze(
            results.filter(({ type }) => type === "community")
        ),
        files: Object.freeze(results.filter(({ type }) => type === "file"))
    });
}

function filteredGroups(results, filter) {
    const activeGroup = FILTER_GROUPS[filter];
    if (!activeGroup) return results;

    return {
        channels: activeGroup === "channels" ? results.channels : [],
        communities: activeGroup === "communities" ? results.communities : [],
        files: activeGroup === "files" ? results.files : []
    };
}

function cacheResult(key, results) {
    resultCache.delete(key);
    resultCache.set(key, { results, timestamp: Date.now() });

    if (resultCache.size > CACHE_LIMIT) {
        resultCache.delete(resultCache.keys().next().value);
    }
}

function readCachedResult(key) {
    const cached = resultCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
        resultCache.delete(key);
        return null;
    }

    return cached.results;
}

function isEditableTarget(target) {
    return (
        target instanceof Element &&
        Boolean(
            target.closest(
                'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
            )
        )
    );
}

export function SearchProvider({ children }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQueryState] = useState("");
    const [results, setResults] = useState(EMPTY_RESULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilterState] = useState("all");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const requestIdRef = useRef(0);

    const visibleResults = useMemo(
        () => filteredGroups(results, filter),
        [filter, results]
    );
    const flatResults = useMemo(
        () => [
            ...visibleResults.communities,
            ...visibleResults.channels,
            ...visibleResults.files
        ],
        [visibleResults]
    );

    const openSearch = useCallback(() => setIsOpen(true), []);

    const closeSearch = useCallback(() => {
        requestIdRef.current += 1;
        setIsOpen(false);
        setQueryState("");
        setResults(EMPTY_RESULTS);
        setLoading(false);
        setError(null);
        setFilterState("all");
        setSelectedIndex(0);
    }, []);

    const performSearch = useCallback((value) => {
        const nextQuery = String(value ?? "");
        const term = nextQuery.trim().toLowerCase();
        const cached = readCachedResult(term);

        requestIdRef.current += 1;
        setQueryState(nextQuery);
        setSelectedIndex(0);
        setError(null);

        if (term.length < MINIMUM_QUERY_LENGTH) {
            setResults(EMPTY_RESULTS);
            setLoading(false);
        } else if (cached) {
            setResults(cached);
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, []);

    const clearSearch = useCallback(() => performSearch(""), [performSearch]);

    const setFilter = useCallback((nextFilter) => {
        setFilterState(
            Object.hasOwn(FILTER_GROUPS, nextFilter) ? nextFilter : "all"
        );
        setSelectedIndex(0);
    }, []);

    const selectNext = useCallback(() => {
        if (!flatResults.length) return;
        setSelectedIndex((current) => (current + 1) % flatResults.length);
    }, [flatResults.length]);

    const selectPrevious = useCallback(() => {
        if (!flatResults.length) return;
        setSelectedIndex(
            (current) => (current - 1 + flatResults.length) % flatResults.length
        );
    }, [flatResults.length]);

    const openResult = useCallback(
        (result = flatResults[selectedIndex]) => {
            if (!result?.url) return;
            closeSearch();
            navigate(result.url);
        },
        [closeSearch, flatResults, navigate, selectedIndex]
    );

    useEffect(() => {
        function handleShortcut(event) {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k" &&
                !isEditableTarget(event.target)
            ) {
                event.preventDefault();
                openSearch();
            }
        }

        document.addEventListener("keydown", handleShortcut);
        return () => document.removeEventListener("keydown", handleShortcut);
    }, [openSearch]);

    useEffect(() => {
        const term = query.trim().toLowerCase();
        const currentRequest = ++requestIdRef.current;

        if (term.length < MINIMUM_QUERY_LENGTH || readCachedResult(term)) {
            return undefined;
        }

        const executeSearch = debounce(async () => {
            try {
                const { globalSearch } =
                    await import("../services/search-service.js");
                const nextResults = groupSearchResults(
                    await globalSearch(term)
                );
                if (requestIdRef.current !== currentRequest) return;
                cacheResult(term, nextResults);
                setResults(nextResults);
            } catch {
                if (requestIdRef.current !== currentRequest) return;
                setResults(EMPTY_RESULTS);
                setError(SEARCH_ERROR_MESSAGE);
            } finally {
                if (requestIdRef.current === currentRequest) {
                    setLoading(false);
                }
            }
        }, SEARCH_DELAY);

        executeSearch();
        return () => executeSearch.cancel();
    }, [query]);

    const value = useMemo(
        () => ({
            clearSearch,
            closeSearch,
            error,
            filter,
            isOpen,
            loading,
            openSearch,
            openResult,
            performSearch,
            query,
            results: visibleResults,
            selectedIndex,
            selectNext,
            selectPrevious,
            setFilter,
            setQuery: performSearch
        }),
        [
            clearSearch,
            closeSearch,
            error,
            filter,
            isOpen,
            loading,
            openSearch,
            openResult,
            performSearch,
            query,
            selectedIndex,
            selectNext,
            selectPrevious,
            setFilter,
            visibleResults
        ]
    );

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}
