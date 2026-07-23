import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import SearchInput from "./SearchInput.jsx";

test("renders a labelled search control", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);
    const search = screen.getByRole("searchbox", { name: "Search" });
    await user.type(search, "notes");
    expect(search).toHaveValue("notes");
});
