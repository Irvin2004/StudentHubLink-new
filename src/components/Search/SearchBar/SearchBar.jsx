import { forwardRef } from "react";

import { AppIcon } from "../../common/AppIcon.jsx";
import Spinner from "../../ui/Spinner/index.js";
import styles from "./SearchBar.module.css";

const DEFAULT_PLACEHOLDER = "Search StudentHub...";

const SearchBar = forwardRef(function SearchBar(
    {
        autoFocus = false,
        disabled = false,
        loading = false,
        onChange,
        onClear,
        onKeyDown,
        placeholder = DEFAULT_PLACEHOLDER,
        value,
        ...inputProps
    },
    ref
) {
    function clearSearch() {
        if (onClear) {
            onClear();
            return;
        }

        onChange("");
    }

    function handleKeyDown(event) {
        if (event.key === "Escape" && value) {
            event.preventDefault();
            clearSearch();
        }

        onKeyDown?.(event);
    }

    return (
        <div
            className={styles.container}
            data-disabled={disabled || undefined}
            data-loading={loading || undefined}
            role="search"
        >
            <AppIcon className={styles.searchIcon} name="search" size={18} />
            <input
                {...inputProps}
                aria-label="Search StudentHub"
                autoComplete="off"
                autoFocus={autoFocus}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                ref={ref}
                type="search"
                value={value}
            />
            {loading ? (
                <Spinner
                    className={styles.spinner}
                    label="Searching"
                    size="small"
                />
            ) : null}
            {!loading && value ? (
                <button
                    aria-label="Clear search"
                    className={styles.clearButton}
                    disabled={disabled}
                    onClick={clearSearch}
                    type="button"
                >
                    <AppIcon name="close" size={16} />
                </button>
            ) : null}
        </div>
    );
});

export default SearchBar;
