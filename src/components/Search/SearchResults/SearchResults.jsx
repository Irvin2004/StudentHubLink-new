import { AppIcon } from "../../common/AppIcon.jsx";
import SearchResultSkeleton from "../../Skeleton/SearchResultSkeleton.jsx";
import { useSearch } from "../../../hooks/useSearch.js";
import SearchResultItem from "../SearchResultItem/SearchResultItem.jsx";
import styles from "./SearchResults.module.css";

const GROUPS = Object.freeze([
    ["communities", "Communities"],
    ["channels", "Channels"],
    ["files", "Files"]
]);

function ResultGroups({ groupOffsets, results }) {
    return (
        <div
            aria-label="Search results"
            className={styles.results}
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
                                key={`${result.type}:${result.url}`}
                                result={result}
                            />
                        ))}
                    </section>
                );
            })}
        </div>
    );
}

export default function SearchResults() {
    const { error, loading, query, results } = useSearch();
    const hasResults = GROUPS.some(([key]) => results[key].length > 0);
    const groupOffsets = {
        channels: results.communities.length,
        communities: 0,
        files: results.communities.length + results.channels.length
    };

    if (query.trim().length < 2) return null;

    if (error) {
        return (
            <div
                className={styles.state}
                id="global-search-results"
                role="alert"
            >
                <strong>Unable to search StudentHub.</strong>
                <p>Please try again.</p>
            </div>
        );
    }

    return (
        <div className={styles.content} id="global-search-results">
            {hasResults ? (
                <ResultGroups groupOffsets={groupOffsets} results={results} />
            ) : null}

            {loading ? <SearchResultSkeleton /> : null}

            {!loading && !hasResults ? (
                <div aria-live="polite" className={styles.state}>
                    <AppIcon
                        className={styles.stateIcon}
                        name="search"
                        size={28}
                    />
                    <strong>No results found.</strong>
                    <p>Try another keyword.</p>
                </div>
            ) : null}
        </div>
    );
}
