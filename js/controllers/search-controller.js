"use strict";

import { auth } from "../firebase/firebase-config.js";
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
    searchEverything
} from "../services/search-service.js?global-search=1";
import { normalizeSearchQuery } from "../utils/search.js";
import { error as logError } from "../utils/logger.js";
import { debounce } from "../utils/debounce.js";

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

/**
 * Creates the global search controller.
 *
 * @param {{input: HTMLInputElement, dropdown: Element}} options
 * @returns {{initialize: Function, destroy: Function}}
 */
export function createSearchController({ input, dropdown } = {}) {
    if (!input?.addEventListener) {
        throw new Error("Search input is required.");
    }

    if (!dropdown?.ownerDocument) {
        throw new Error("Search dropdown is required.");
    }

    let requestSequence = 0;
    let dropdownState = null;
    let initialized = false;

    async function performSearch(query, requestId) {
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
                !initialized ||
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
            if (!initialized || requestId !== requestSequence) {
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
    }

    const scheduleSearch = debounce(
        (query, requestId) => performSearch(query, requestId),
        DEBOUNCE_DELAY
    );

    function handleInput() {
        const query = normalizeSearchQuery(input.value);
        const requestId = ++requestSequence;

        scheduleSearch.cancel();

        if (query.length < 2) {
            closeSearchDropdown(dropdown);
            return;
        }

        scheduleSearch(query, requestId);
    }

    function initialize() {
        if (initialized) {
            return;
        }

        searchControllers.get(input)?.destroy();
        dropdownState = createSearchDropdown(dropdown);

        if (dropdownState.input !== input) {
            dropdownState.destroy();
            dropdownState = null;
            throw new Error(
                "Search dropdown must contain the search input."
            );
        }

        input.addEventListener("input", handleInput);
        searchControllers.set(input, controller);
        initialized = true;
    }

    function destroy() {
        if (!initialized) {
            return;
        }

        requestSequence += 1;
        scheduleSearch.cancel();
        input.removeEventListener("input", handleInput);
        dropdownState?.destroy();
        dropdownState = null;
        searchControllers.delete(input);
        initialized = false;
    }

    const controller = {
        initialize,
        destroy
    };

    return controller;
}
