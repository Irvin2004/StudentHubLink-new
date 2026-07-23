import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Field from "./Field.jsx";

test("associates its label and validation message with nested controls", () => {
    render(
        <Field error="This value is required" id="example" label="Example">
            <input aria-describedby="example-message" id="example" />
        </Field>
    );

    expect(screen.getByLabelText("Example")).toHaveAccessibleDescription(
        "This value is required"
    );
});
