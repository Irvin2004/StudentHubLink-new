import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import Button from "./Button.jsx";

test("renders, clicks, disables, and exposes loading state", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<Button disabled>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    rerender(
        <Button loading loadingLabel="Saving">
            Save
        </Button>
    );
    expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute(
        "aria-busy",
        "true"
    );
});
