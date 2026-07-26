import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "./FormField.jsx";

describe("FormField", () => {
    it("associates its label and supporting text with the input", () => {
        render(
            <FormField
                helpText="Use at least eight characters."
                id="password"
                label="Password"
                type="password"
            />
        );

        const input = screen.getByLabelText("Password");

        expect(input).toHaveAttribute("id", "password");
        expect(input).toHaveAccessibleDescription(
            "Use at least eight characters."
        );
    });
});
