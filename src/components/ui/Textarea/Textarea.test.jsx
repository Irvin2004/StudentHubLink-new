import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Textarea from "./Textarea.jsx";

test("renders a labelled multiline input and accepts text", async () => {
    const user = userEvent.setup();
    render(<Textarea helperText="Keep it concise" label="Description" />);

    const textarea = screen.getByLabelText("Description");
    await user.type(textarea, "A useful note");
    expect(textarea).toHaveValue("A useful note");
    expect(textarea).toHaveAccessibleDescription("Keep it concise");
});
