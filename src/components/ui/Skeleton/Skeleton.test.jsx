import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import Skeleton from "./Skeleton.jsx";

test("renders the requested placeholders hidden from assistive technology", () => {
    const { container } = render(<Skeleton count={3} />);
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
    expect(
        container.querySelectorAll("[aria-hidden='true'] > span")
    ).toHaveLength(3);
});
