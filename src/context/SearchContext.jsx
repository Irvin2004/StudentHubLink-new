import { SearchContext } from "./search-context.js";
import { useSearchController } from "../hooks/useSearch.js";

export function SearchProvider({ children }) {
    const search = useSearchController();

    return (
        <SearchContext.Provider value={search}>
            {children}
        </SearchContext.Provider>
    );
}
