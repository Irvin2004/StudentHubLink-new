import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { useNavigate } from "react-router-dom";

import { SearchContext } from "../context/search-context.js";
import { debounce } from "../utils/debounce.js";
import { getActionableErrorMessage } from "../utils/app-error-mapper.js";

const EMPTY_RESULTS = Object.freeze({
    channels: Object.freeze([]),
    communities: Object.freeze([]),
    files: Object.freeze([])
});
const SEARCH_DELAY = 300;
const MINIMUM_QUERY_LENGTH = 2;
const CACHE_DURATION = 2 * 60 * 1000;
const CACHE_LIMIT = 20;
const resultCache = new Map();

function filteredGroups(results, filter) {
    if (filter === "all") return results;
    return {
        channels: filter === "channels" ? results.channels : [],
        communities: filter === "communities" ? results.communities : [],
        files: filter === "files" ? results.files : []
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

export function useSearchController() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQueryState] = useState("");
    const [results, setResults] = useState(EMPTY_RESULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilterState] = useState("all");
    const [activeIndex, setActiveIndex] = useState(-1);
    const requestIdRef = useRef(0);

    const visibleResults = useMemo(
        () => filteredGroups(results, activeFilter),
        [activeFilter, results]
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
        setError("");
        setActiveFilterState("all");
        setActiveIndex(-1);
    }, []);
    const setQuery = useCallback((value) => {
        const nextQuery = String(value ?? "");
        const term = nextQuery.trim().toLowerCase();
        const cached = readCachedResult(term);

        requestIdRef.current += 1;
        setQueryState(nextQuery);
        setActiveIndex(-1);
        setError("");

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
    const clearSearch = useCallback(() => setQuery(""), [setQuery]);
    const setActiveFilter = useCallback((filter) => {
        setActiveFilterState(filter);
        setActiveIndex(-1);
    }, []);

    useEffect(() => {
        function handleShortcut(event) {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                setIsOpen(true);
            }
        }

        document.addEventListener("keydown", handleShortcut);
        return () => document.removeEventListener("keydown", handleShortcut);
    }, []);

    useEffect(() => {
        const term = query.trim().toLowerCase();
        const currentRequest = ++requestIdRef.current;

        if (term.length < MINIMUM_QUERY_LENGTH) {
            return undefined;
        }

        const cached = readCachedResult(term);
        if (cached) {
            return undefined;
        }

        const executeSearch = debounce(async () => {
            try {
                const { globalSearch } =
                    await import("../services/search-service.js");
                const nextResults = await globalSearch(term);
                if (requestIdRef.current !== currentRequest) return;
                cacheResult(term, nextResults);
                setResults(nextResults);
            } catch (searchError) {
                if (requestIdRef.current !== currentRequest) return;
                setResults(EMPTY_RESULTS);
                setError(getActionableErrorMessage(searchError, "search"));
            } finally {
                if (requestIdRef.current === currentRequest) {
                    setLoading(false);
                }
            }
        }, SEARCH_DELAY);

        executeSearch();
        return () => executeSearch.cancel();
    }, [query]);

    const moveSelection = useCallback(
        (direction) => {
            if (!flatResults.length) return;
            setActiveIndex((current) => {
                if (direction > 0) {
                    return current >= flatResults.length - 1 ? 0 : current + 1;
                }
                return current <= 0 ? flatResults.length - 1 : current - 1;
            });
        },
        [flatResults.length]
    );

    const activateResult = useCallback(
        (result = flatResults[activeIndex]) => {
            if (!result?.url) return;
            closeSearch();
            navigate(result.url);
        },
        [activeIndex, closeSearch, flatResults, navigate]
    );

    return useMemo(
        () => ({
            activateResult,
            activeFilter,
            activeIndex,
            clearSearch,
            closeSearch,
            error,
            isOpen,
            loading,
            moveSelection,
            openSearch,
            query,
            results: visibleResults,
            setActiveFilter,
            setActiveIndex,
            setQuery
        }),
        [
            activateResult,
            activeFilter,
            activeIndex,
            clearSearch,
            closeSearch,
            error,
            isOpen,
            loading,
            moveSelection,
            openSearch,
            query,
            setActiveFilter,
            setQuery,
            visibleResults
        ]
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error("useSearch must be used within SearchProvider.");
    }
    return context;
}
