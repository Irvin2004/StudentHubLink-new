import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import CreateCommunityModal from "./CreateCommunityModal.jsx";

describe("CreateCommunityModal", () => {
    afterEach(cleanup);

    test("validates required domain fields before submission", async () => {
        const onCreate = vi.fn();
        const user = userEvent.setup();

        render(
            <CreateCommunityModal onClose={vi.fn()} onCreate={onCreate} open />
        );

        expect(
            screen.getByRole("textbox", { name: /Community name/ })
        ).toHaveFocus();

        await user.click(
            screen.getByRole("button", { name: "Create community" })
        );

        expect(
            screen.getByText("Community name must be at least 3 characters.")
        ).toBeInTheDocument();
        expect(
            screen.getByText("Choose a community category.")
        ).toBeInTheDocument();
        expect(screen.getAllByRole("alert")).toHaveLength(2);
        expect(
            screen.getByRole("textbox", { name: /Community name/ })
        ).toHaveAccessibleDescription(
            "Community name must be at least 3 characters."
        );
        expect(onCreate).not.toHaveBeenCalled();
    });

    test("submits normalized form-ready values", async () => {
        const onCreate = vi.fn().mockResolvedValue({ id: "community-1" });
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(
            <CreateCommunityModal onClose={onClose} onCreate={onCreate} open />
        );

        fireEvent.change(
            screen.getByRole("textbox", { name: /Community name/ }),
            { target: { value: "Robotics Club" } }
        );
        fireEvent.change(screen.getByRole("combobox", { name: /Category/ }), {
            target: { value: "technology" }
        });
        await user.click(
            screen.getByRole("button", { name: "Create community" })
        );

        await waitFor(() => {
            expect(onCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "Robotics Club",
                    category: "technology",
                    visibility: "public",
                    avatar: null,
                    banner: null
                })
            );
            expect(onClose).toHaveBeenCalledOnce();
        });
    });
});
