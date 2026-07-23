const dropdownStates = new WeakMap();
let activeDropdown = null;
let dropdownId = 0;

function findSearchInput(container) {
    if (container.matches?.("input")) {
        return container;
    }

    const localInput = container.querySelector?.(
        'input[type="search"], [role="searchbox"], input'
    );

    if (localInput) {
        return localInput;
    }

    const siblingInput = container.previousElementSibling;

    if (siblingInput?.matches?.("input")) {
        return siblingInput;
    }

    return null;
}

function getState(container) {
    const target = container || activeDropdown;
    const state = target ? dropdownStates.get(target) : null;

    if (!state) {
        throw new Error("Search dropdown has not been created.");
    }

    return state;
}

function getOptions(state) {
    return [...state.content.querySelectorAll(".search-result")];
}

function setSelectedIndex(state, nextIndex) {
    const options = getOptions(state);

    if (!options.length || nextIndex < 0) {
        options.forEach((option) => {
            option.classList.remove("selected");
            option.setAttribute("aria-selected", "false");
        });
        state.selectedIndex = -1;
        state.input.removeAttribute("aria-activedescendant");
        return;
    }

    const normalizedIndex =
        ((nextIndex % options.length) + options.length) % options.length;

    options.forEach((option, index) => {
        const isSelected = index === normalizedIndex;

        option.classList.toggle("selected", isSelected);
        option.setAttribute("aria-selected", String(isSelected));
    });

    state.selectedIndex = normalizedIndex;
    state.input.setAttribute(
        "aria-activedescendant",
        options[normalizedIndex].id
    );
    options[normalizedIndex].scrollIntoView?.({ block: "nearest" });
}

function prepareOptions(state) {
    const options = getOptions(state);

    options.forEach((option, index) => {
        if (!option.id) {
            option.id = `${state.content.id}Option${index + 1}`;
        }

        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.setAttribute("tabindex", "-1");
        option.classList.remove("selected");
    });

    state.selectedIndex = -1;
    state.input.removeAttribute("aria-activedescendant");
}

function handleNavigationKey(state, event) {
    const options = getOptions(state);

    if (event.key === "Escape") {
        if (!state.dropdown.hidden) {
            event.preventDefault();
            closeSearchDropdown(state.container);
            state.input.focus();
        }
        return;
    }

    if (!options.length) {
        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();
        openSearchDropdown(state.container);
        setSelectedIndex(state, state.selectedIndex + 1);
        return;
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();
        openSearchDropdown(state.container);
        setSelectedIndex(
            state,
            state.selectedIndex < 0
                ? options.length - 1
                : state.selectedIndex - 1
        );
        return;
    }

    if (event.key === "Enter" && state.selectedIndex >= 0) {
        event.preventDefault();
        options[state.selectedIndex].click();
    }
}

export function createSearchDropdown(container) {
    if (!container?.ownerDocument) {
        throw new Error("Search dropdown container is required.");
    }

    dropdownStates.get(container)?.destroy();

    const input = findSearchInput(container);

    if (!input) {
        throw new Error("Search input is required.");
    }

    const ownerDocument = container.ownerDocument;
    const dropdown = ownerDocument.createElement("div");
    const header = ownerDocument.createElement("div");
    const content = ownerDocument.createElement("div");

    dropdownId += 1;
    content.id = `searchDropdownList${dropdownId}`;

    container.classList.add("search-dropdown-host");
    dropdown.className = "search-dropdown";
    dropdown.hidden = true;
    dropdown.setAttribute("aria-label", "Search results");

    header.className = "search-dropdown-header";
    header.textContent = "Search results";

    content.className = "search-dropdown-content";
    content.setAttribute("role", "listbox");
    content.setAttribute("aria-live", "polite");

    dropdown.append(header, content);
    container.append(dropdown);

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", content.id);
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");

    const handleKeydown = (event) => handleNavigationKey(state, event);
    const handleOutsideClick = (event) => {
        if (!container.contains(event.target)) {
            closeSearchDropdown(container);
        }
    };
    const handlePointerMove = (event) => {
        const option = event.target.closest?.(".search-result");

        if (!option || !content.contains(option)) {
            return;
        }

        setSelectedIndex(state, getOptions(state).indexOf(option));
    };
    const handleResultClick = (event) => {
        if (event.target.closest?.(".search-result")) {
            closeSearchDropdown(container);
        }
    };

    const state = {
        container,
        input,
        dropdown,
        content,
        selectedIndex: -1,
        destroy() {
            closeSearchDropdown(container);
            input.removeEventListener("keydown", handleKeydown);
            dropdown.removeEventListener("keydown", handleKeydown);
            content.removeEventListener("pointermove", handlePointerMove);
            content.removeEventListener("click", handleResultClick);
            ownerDocument.removeEventListener("click", handleOutsideClick);
            dropdown.remove();
            container.classList.remove("search-dropdown-host");
            input.removeAttribute("aria-activedescendant");
            input.removeAttribute("aria-autocomplete");
            input.removeAttribute("aria-controls");
            input.removeAttribute("aria-expanded");
            input.removeAttribute("role");
            dropdownStates.delete(container);

            if (activeDropdown === container) {
                activeDropdown = null;
            }
        }
    };

    input.addEventListener("keydown", handleKeydown);
    dropdown.addEventListener("keydown", handleKeydown);
    content.addEventListener("pointermove", handlePointerMove);
    content.addEventListener("click", handleResultClick);
    ownerDocument.addEventListener("click", handleOutsideClick);

    dropdownStates.set(container, state);
    activeDropdown = container;
    return state;
}

export function openSearchDropdown(container) {
    const state = getState(container);

    state.dropdown.hidden = false;
    state.dropdown.classList.add("open");
    state.input.setAttribute("aria-expanded", "true");
}

export function closeSearchDropdown(container) {
    const state = getState(container);

    state.dropdown.hidden = true;
    state.dropdown.classList.remove("open");
    state.input.setAttribute("aria-expanded", "false");
    setSelectedIndex(state, -1);
}

export function toggleSearchDropdown(container) {
    const state = getState(container);

    if (state.dropdown.hidden) {
        openSearchDropdown(state.container);
        return;
    }

    closeSearchDropdown(state.container);
}

export function setSearchDropdownContent(node, container) {
    const state = getState(container);
    const NodeConstructor = state.container.ownerDocument.defaultView?.Node;

    if (NodeConstructor && node instanceof NodeConstructor) {
        state.content.replaceChildren(node);
    } else {
        state.content.innerHTML = String(node || "");
    }

    prepareOptions(state);
    return state.content;
}

export function isSearchDropdownOpen(container) {
    return !getState(container).dropdown.hidden;
}
