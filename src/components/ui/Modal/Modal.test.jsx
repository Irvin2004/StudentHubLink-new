import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import Button from "../Button/index.js";
import Modal from "./Modal.jsx";

test("traps focus, closes on Escape, and restores focus", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    function ModalHarness() {
        const [open, setOpen] = useState(false);

        function close() {
            onClose();
            setOpen(false);
        }

        return (
            <>
                <button onClick={() => setOpen(true)} type="button">
                    Open
                </button>
                <Modal
                    footer={<Button>Continue</Button>}
                    onClose={close}
                    open={open}
                    title="Confirm action"
                >
                    Are you sure?
                </Modal>
            </>
        );
    }

    render(<ModalHarness />);

    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeVisible();
    const closeButton = screen.getByRole("button", { name: "Close dialog" });
    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(continueButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
    await waitFor(() => expect(trigger).toHaveFocus());
});
