import { forwardRef } from "react";

import Input from "../Input/index.js";

function SearchIcon() {
    return (
        <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
            <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="m16 16 4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

/**
 * Renders a search-specialized Input with a standard accessible label.
 */
const SearchInput = forwardRef(function SearchInput(
    { label = "Search", placeholder = "Search", ...props },
    ref
) {
    return (
        <Input
            {...props}
            icon={<SearchIcon />}
            label={label}
            placeholder={placeholder}
            ref={ref}
            type="search"
        />
    );
});

export default SearchInput;
