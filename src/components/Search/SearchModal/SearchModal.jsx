import { useRef } from "react";

import Modal from "../../ui/Modal/index.js";
import { useSearch } from "../../../hooks/useSearch.js";
import SearchBar from "../SearchBar/index.js";
import SearchFilters from "../SearchFilters/SearchFilters.jsx";
import SearchResults from "../SearchResults/SearchResults.jsx";
import styles from "./SearchModal.module.css";

export default function SearchModal({ onClose, open }) {
    const {
        clearSearch,
        loading,
        openResult,
        performSearch,
        query,
        selectedIndex,
        selectNext,
        selectPrevious
    } = useSearch();
    const inputRef = useRef(null);

    function handleKeyDown(event) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (event.key === "ArrowDown") {
                selectNext();
            } else {
                selectPrevious();
            }
        } else if (event.key === "Enter") {
            event.preventDefault();
            openResult();
        }
    }

    return (
        <Modal
            className={styles.dialog}
            closeLabel="Close Search"
            description="Search communities, channels, and shared files."
            initialFocusRef={inputRef}
            onClose={onClose}
            open={open}
            size="wide"
            title="Search StudentHub"
        >
            <div className={styles.search}>
                <SearchBar
                    aria-activedescendant={
                        selectedIndex >= 0
                            ? `global-search-result-${selectedIndex}`
                            : undefined
                    }
                    aria-controls="global-search-results"
                    aria-expanded="true"
                    loading={loading}
                    onChange={performSearch}
                    onClear={clearSearch}
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
                    <span>Up / Down Navigate</span>
                    <span>Enter Open</span>
                    <span>Esc Close</span>
                </footer>
            </div>
        </Modal>
    );
}
