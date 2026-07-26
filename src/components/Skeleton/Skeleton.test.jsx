import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import ChatMessageSkeleton from "./ChatMessageSkeleton.jsx";
import CommunityCardSkeleton from "./CommunityCardSkeleton.jsx";
import FileCardSkeleton from "./FileCardSkeleton.jsx";
import SearchResultSkeleton from "./SearchResultSkeleton.jsx";
import Skeleton from "./Skeleton.jsx";

describe("Skeleton", () => {
    test("renders a decorative base placeholder with dimensions", () => {
        const { container } = render(
            <Skeleton borderRadius="8px" height="20px" width="75%" />
        );
        const group = container.firstElementChild;
        const placeholder = container.querySelector("[data-skeleton]");

        expect(group).toHaveAttribute("aria-hidden", "true");
        expect(placeholder).toHaveStyle({
            borderRadius: "8px",
            height: "20px",
            width: "75%"
        });
    });

    test.each([
        [CommunityCardSkeleton, "Loading communities"],
        [SearchResultSkeleton, "Searching StudentHub"],
        [ChatMessageSkeleton, "Loading messages"],
        [FileCardSkeleton, "Loading files"]
    ])("%s renders an accessible loading layout", (Component, label) => {
        render(<Component count={2} />);

        const status = screen.getByRole("status");
        expect(status).toHaveAttribute("aria-busy", "true");
        expect(status).toHaveTextContent(label);
        expect(
            document.querySelectorAll("[data-skeleton]").length
        ).toBeGreaterThan(1);
    });
});
