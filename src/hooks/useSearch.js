import { useContext } from "react";

import { SearchContext } from "../context/search-context.js";

export function useSearch() {
    const context = useContext(SearchContext);

    if (!context) {
        throw new Error("useSearch must be used inside SearchProvider");
    }

    return context;
}
