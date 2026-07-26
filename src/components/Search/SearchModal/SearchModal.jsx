import { useRef } from "react";

import Modal from "../../ui/Modal/index.js";
import SearchInput from "../../ui/SearchInput/index.js";
import { useSearch } from "../../../hooks/useSearch.js";
import SearchFilters from "../SearchFilters/SearchFilters.jsx";
import SearchResults from "../SearchResults/SearchResults.jsx";
import styles from "./SearchModal.module.css";

export default function SearchModal() {
    const {
        activateResult,
        activeIndex,
        closeSearch,
        isOpen,
        moveSelection,
        query,
        setQuery
    } = useSearch();
    const inputRef = useRef(null);

    function handleKeyDown(event) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            moveSelection(event.key === "ArrowDown" ? 1 : -1);
        } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            activateResult();
        }
    }

    return (
        <Modal
            description="Search communities, channels, and shared files."
            initialFocusRef={inputRef}
            onClose={closeSearch}
            open={isOpen}
            size="wide"
            title="Search StudentHub"
        >
            <div className={styles.search}>
                <SearchInput
                    aria-activedescendant={
                        activeIndex >= 0
                            ? `global-search-result-${activeIndex}`
                            : undefined
                    }
                    aria-controls="global-search-results"
                    aria-expanded="true"
                    autoComplete="off"
                    label="Search StudentHub"
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search StudentHub..."
                    ref={inputRef}
                    role="combobox"
                    value={query}
                />
                <div className={styles.filters}>
                    <SearchFilters />
                </div>
                <SearchResults />
                <footer className={styles.hints} aria-hidden="true">
                    <span>↑ ↓ Navigate</span>
                    <span>Enter Open</span>
                    <span>Esc Close</span>
                </footer>
            </div>
        </Modal>
    );
}
