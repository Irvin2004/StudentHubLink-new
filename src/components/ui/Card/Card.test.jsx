import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Card from "./Card.jsx";

test("supports a configurable semantic element", () => {
    render(
        <Card as="article" aria-label="Summary">
            Content
        </Card>
    );
    expect(screen.getByRole("article", { name: "Summary" })).toBeVisible();
});
