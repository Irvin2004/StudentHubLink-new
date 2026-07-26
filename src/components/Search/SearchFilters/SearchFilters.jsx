import { useSearch } from "../../../hooks/useSearch.js";

const FILTERS = Object.freeze([
    ["all", "All"],
    ["communities", "Communities"],
    ["channels", "Channels"],
    ["files", "Files"]
]);

export default function SearchFilters() {
    const { activeFilter, setActiveFilter } = useSearch();

    return (
        <div aria-label="Filter search results" role="group">
            {FILTERS.map(([value, label]) => (
                <button
                    aria-pressed={activeFilter === value}
                    key={value}
                    onClick={() => setActiveFilter(value)}
                    type="button"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
