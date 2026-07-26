import { useSearch } from "../../../hooks/useSearch.js";

const FILTERS = Object.freeze([
    ["all", "All"],
    ["community", "Communities"],
    ["channel", "Channels"],
    ["file", "Files"]
]);

export default function SearchFilters() {
    const { filter, setFilter } = useSearch();

    return (
        <div aria-label="Filter search results" role="group">
            {FILTERS.map(([value, label]) => (
                <button
                    aria-pressed={filter === value}
                    key={value}
                    onClick={() => setFilter(value)}
                    type="button"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
