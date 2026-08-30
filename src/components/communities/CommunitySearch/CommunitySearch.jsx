import { useEffect, useMemo, useState } from "react";

import SearchInput from "../../ui/SearchInput/index.js";
import Select from "../../ui/Select/index.js";
import { COMMUNITY_CATEGORIES } from "../../../utils/community-validation.js";
import { debounce } from "../../../utils/debounce.js";
import styles from "./CommunitySearch.module.css";

export default function CommunitySearch({
    category,
    onCategoryChange,
    onSearch
}) {
    const [query, setQuery] = useState("");
    const debouncedSearch = useMemo(
        () => debounce((value) => onSearch(value), 300),
        [onSearch]
    );

    useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

    return (
        <div className={styles.controls}>
            <SearchInput
                label="Search communities"
                onChange={(event) => {
                    const value = event.target.value;
                    setQuery(value);
                    debouncedSearch(value);
                }}
                placeholder="Search communities"
                value={query}
            />
            <Select
                aria-label="Filter communities by category"
                label="Category"
                onChange={(event) => onCategoryChange(event.target.value)}
                value={category}
            >
                <option value="">All categories</option>
                {COMMUNITY_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                ))}
            </Select>
        </div>
    );
}
