import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import CreateChannelModal from "./CreateChannelModal.jsx";

describe("CreateChannelModal", () => {
    afterEach(cleanup);

    test("normalizes and creates a channel", async () => {
        const onCreate = vi.fn().mockResolvedValue({ id: "study-group" });

        render(
            <CreateChannelModal
                communityName="Science Society"
                onClose={vi.fn()}
                onCreate={onCreate}
                open
            />
        );

        fireEvent.change(
            screen.getByRole("textbox", { name: /Channel name/ }),
            { target: { value: "Study Group" } }
        );
        fireEvent.click(screen.getByRole("button", { name: "Create channel" }));

        await waitFor(() =>
            expect(onCreate).toHaveBeenCalledWith(
                expect.objectContaining({ name: "study-group" })
            )
        );
    });

    test("rejects the reserved general name", async () => {
        render(
            <CreateChannelModal
                communityName="Science Society"
                onClose={vi.fn()}
                onCreate={vi.fn()}
                open
            />
        );

        fireEvent.change(
            screen.getByRole("textbox", { name: /Channel name/ }),
            { target: { value: "general" } }
        );
        fireEvent.click(screen.getByRole("button", { name: "Create channel" }));

        expect(
            await screen.findByText(/reserved for the default channel/)
        ).toBeInTheDocument();
    });
});
