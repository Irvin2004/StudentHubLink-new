import { AppIcon } from "../../common/AppIcon.jsx";
import { useSearch } from "../../../hooks/useSearch.js";
import styles from "./SearchBar.module.css";

export default function SearchBar() {
    const { openSearch, query, setQuery } = useSearch();

    return (
        <div className={styles.wrapper} role="search">
            <AppIcon name="search" size={20} />
            <label className="sr-only" htmlFor="global-search-trigger">
                Search StudentHub
            </label>
            <input
                aria-haspopup="dialog"
                autoComplete="off"
                id="global-search-trigger"
                onChange={(event) => {
                    setQuery(event.target.value);
                    openSearch();
                }}
                onFocus={openSearch}
                placeholder="Search StudentHub"
                type="search"
                value={query}
            />
            <kbd aria-hidden="true">Ctrl K</kbd>
            <button
                aria-label="Open global search"
                className={styles.mobileTrigger}
                onClick={openSearch}
                type="button"
            >
                <AppIcon name="search" size={21} />
            </button>
        </div>
    );
}
