import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Avatar from "./Avatar.jsx";

test("renders fallback initials and announces presence", () => {
    render(<Avatar name="Alex Morgan" status="online" />);
    expect(
        screen.getByRole("img", { name: "Alex Morgan, online" })
    ).toHaveTextContent("AM");
});
