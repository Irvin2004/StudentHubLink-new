import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import Toast from "./Toast.jsx";

test("uses live-region semantics and dismisses", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
        <Toast
            message="Please try again."
            onDismiss={onDismiss}
            title="Unable to save"
            type="error"
        />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save");
    await user.click(
        screen.getByRole("button", { name: "Dismiss notification" })
    );
    expect(onDismiss).toHaveBeenCalledOnce();
});
