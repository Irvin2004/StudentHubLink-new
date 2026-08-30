import { useEffect, useMemo, useState } from "react";

import SearchInput from "../../ui/SearchInput/index.js";
import { debounce } from "../../../utils/debounce.js";
import styles from "./ChannelSearch.module.css";

export default function ChannelSearch({ onSearch }) {
    const [query, setQuery] = useState("");
    const debouncedSearch = useMemo(() => debounce(onSearch, 250), [onSearch]);

    useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

    return (
        <div className={styles.search}>
            <SearchInput
                label="Search channels"
                onChange={(event) => {
                    const value = event.target.value;
                    setQuery(value);
                    debouncedSearch(value);
                }}
                placeholder="Search channels"
                value={query}
            />
        </div>
    );
}
