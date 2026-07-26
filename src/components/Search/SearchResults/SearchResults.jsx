import { AppIcon } from "../../common/AppIcon.jsx";
import Skeleton from "../../ui/Skeleton/index.js";
import { useSearch } from "../../../hooks/useSearch.js";
import SearchResultItem from "../SearchResultItem/SearchResultItem.jsx";
import styles from "./SearchResults.module.css";

const GROUPS = Object.freeze([
    ["communities", "Communities"],
    ["channels", "Channels"],
    ["files", "Files"]
]);

export default function SearchResults() {
    const { error, loading, query, results } = useSearch();
    const hasResults = GROUPS.some(([key]) => results[key].length > 0);
    const groupOffsets = {
        channels: results.communities.length,
        communities: 0,
        files: results.communities.length + results.channels.length
    };

    if (loading) {
        return (
            <div
                aria-live="polite"
                className={styles.state}
                id="global-search-results"
                role="status"
            >
                <span className="sr-only">Searching StudentHub</span>
                <Skeleton count={3} height="3.5rem" />
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={styles.state}
                id="global-search-results"
                role="alert"
            >
                <strong>Couldn&apos;t search StudentHub.</strong>
                <p>Check your internet connection.</p>
            </div>
        );
    }

    if (query.trim().length < 2) {
        return (
            <div className={styles.state} id="global-search-results">
                <strong>Find anything in StudentHub</strong>
                <p>Type at least two characters to start searching.</p>
            </div>
        );
    }

    if (!hasResults) {
        return (
            <div
                aria-live="polite"
                className={styles.state}
                id="global-search-results"
            >
                <AppIcon className={styles.stateIcon} name="search" size={28} />
                <strong>No results found.</strong>
                <p>Try another search.</p>
            </div>
        );
    }

    return (
        <div
            aria-label="Search results"
            className={styles.results}
            id="global-search-results"
            role="listbox"
        >
            {GROUPS.map(([key, label]) => {
                const group = results[key];
                if (!group.length) return null;

                return (
                    <section className={styles.group} key={key}>
                        <h3>{label}</h3>
                        {group.map((result, index) => (
                            <SearchResultItem
                                index={groupOffsets[key] + index}
                                key={`${result.type}:${result.id}`}
                                result={result}
                            />
                        ))}
                    </section>
                );
            })}
        </div>
    );
}
