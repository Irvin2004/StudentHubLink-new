import { useSearch } from "../../../hooks/useSearch.js";
import styles from "./SearchResultItem.module.css";

const ICONS = Object.freeze({
    channel: "#",
    community: "📚",
    file: "📄"
});

export default function SearchResultItem({ index, result }) {
    const { openResult, selectedIndex } = useSearch();
    const active = selectedIndex === index;

    return (
        <button
            aria-selected={active}
            className={styles.item}
            id={`global-search-result-${index}`}
            onClick={() => openResult(result)}
            role="option"
            tabIndex={-1}
            type="button"
        >
            <span aria-hidden="true" className={styles.icon}>
                {ICONS[result.icon] || "•"}
            </span>
            <span className={styles.copy}>
                <strong>{result.title}</strong>
                <small>{result.subtitle}</small>
            </span>
            <span aria-hidden="true" className={styles.arrow}>
                ↗
            </span>
        </button>
    );
}
