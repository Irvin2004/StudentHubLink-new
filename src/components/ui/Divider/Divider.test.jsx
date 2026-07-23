import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Divider from "./Divider.jsx";

test("exposes separator orientation and label", () => {
    render(<Divider label="More" orientation="vertical" />);
    expect(screen.getByRole("separator", { name: "More" })).toHaveAttribute(
        "aria-orientation",
        "vertical"
    );
});
