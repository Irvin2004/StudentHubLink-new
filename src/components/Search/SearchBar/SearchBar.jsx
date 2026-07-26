import { AppIcon } from "../../common/AppIcon.jsx";
import Spinner from "../../ui/Spinner/index.js";
import styles from "./SearchBar.module.css";

const DEFAULT_PLACEHOLDER = "Search StudentHub...";

export default function SearchBar({
    autoFocus = false,
    disabled = false,
    loading = false,
    onChange,
    onClear,
    placeholder = DEFAULT_PLACEHOLDER,
    value
}) {
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
                aria-label="Search StudentHub"
                autoComplete="off"
                autoFocus={autoFocus}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
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
}
