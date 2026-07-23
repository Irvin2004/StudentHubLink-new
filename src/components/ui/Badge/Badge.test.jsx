import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Badge from "./Badge.jsx";

test("renders semantic badge content", () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText("Active")).toBeVisible();
});
