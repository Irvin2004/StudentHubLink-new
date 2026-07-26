import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Select from "./Select.jsx";

test("selects an option through its accessible label", async () => {
    const user = userEvent.setup();
    render(
        <Select label="Level">
            <option value="one">One</option>
            <option value="two">Two</option>
        </Select>
    );

    await user.selectOptions(screen.getByLabelText("Level"), "two");
    expect(screen.getByLabelText("Level")).toHaveValue("two");
});
