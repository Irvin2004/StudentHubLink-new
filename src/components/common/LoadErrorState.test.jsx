import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { LoadErrorState } from "./LoadErrorState.jsx";

test("announces a load failure and supports retrying", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
        <LoadErrorState
            description="Communities could not be loaded."
            onRetry={onRetry}
            title="Communities unavailable"
        />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
        "Communities could not be loaded."
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
});
