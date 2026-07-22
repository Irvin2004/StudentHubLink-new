"use strict";

import { auth } from "../firebase.js";
import {
    closeSearchDropdown,
    createSearchDropdown,
    openSearchDropdown,
    setSearchDropdownContent
} from "../components/search-dropdown.js?global-search=1";
import {
    renderSearchError,
    renderSearchLoading,
    renderSearchResults
} from "../renderers/search-renderer.js?global-search=1";
import {
    normalizeSearchQuery,
    searchEverything
} from "../services/search-service.js?global-search=1";
import { error as logError } from "../utils/logger.js";

const DEBOUNCE_DELAY = 300;
const searchControllers = new WeakMap();

function renderDropdownState({
    dropdown,
    input,
    render,
    value
}) {
    const stagingContainer = input.ownerDocument.createElement("div");

    render(value, stagingContainer);
    setSearchDropdownContent(stagingContainer, dropdown);
}

export function initialiseSearch({ input, dropdown } = {}) {
    if (!input?.addEventListener) {
        throw new Error("Search input is required.");
    }

    if (!dropdown?.ownerDocument) {
        throw new Error("Search dropdown is required.");
    }

    searchControllers.get(input)?.();

    const dropdownState = createSearchDropdown(dropdown);

    if (dropdownState.input !== input) {
        dropdownState.destroy();
        throw new Error("Search dropdown must contain the search input.");
    }

    let debounceTimer = null;
    let requestSequence = 0;
    let destroyed = false;

    const performSearch = async (query, requestId) => {
        renderDropdownState({
            dropdown,
            input,
            render: (_, container) => renderSearchLoading(container)
        });
        openSearchDropdown(dropdown);

        try {
            const userId = auth.currentUser?.uid;

            if (!userId) {
                throw new Error("Sign in before searching StudentHub.");
            }

            const results = await searchEverything(userId, query);

            if (
                destroyed ||
                requestId !== requestSequence ||
                normalizeSearchQuery(input.value) !== query
            ) {
                return;
            }

            renderDropdownState({
                dropdown,
                input,
                render: renderSearchResults,
                value: results
            });
            openSearchDropdown(dropdown);
        } catch (error) {
            if (destroyed || requestId !== requestSequence) {
                return;
            }

            logError("SEARCH", "Global search failed:", error);
            renderDropdownState({
                dropdown,
                input,
                render: (_, container) => renderSearchError(container)
            });
            openSearchDropdown(dropdown);
        }
    };

    const handleInput = () => {
        const query = normalizeSearchQuery(input.value);
        const requestId = ++requestSequence;

        clearTimeout(debounceTimer);
        debounceTimer = null;

        if (query.length < 2) {
            closeSearchDropdown(dropdown);
            return;
        }

        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            performSearch(query, requestId);
        }, DEBOUNCE_DELAY);
    };

    const destroy = () => {
        if (destroyed) return;

        destroyed = true;
        requestSequence += 1;
        clearTimeout(debounceTimer);
        input.removeEventListener("input", handleInput);
        dropdownState.destroy();
        searchControllers.delete(input);
    };

    input.addEventListener("input", handleInput);
    searchControllers.set(input, destroy);
    return destroy;
}
