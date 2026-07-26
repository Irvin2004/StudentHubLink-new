import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Spinner from "./Spinner.jsx";

test("announces its loading label", () => {
    render(<Spinner label="Saving" />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Saving");
});
