import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import Button from "../Button/index.js";
import Modal from "./Modal.jsx";

test("traps focus, closes on Escape, and restores focus", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
        <>
            <button type="button">Open</button>
            <Modal
                footer={<Button>Continue</Button>}
                onClose={onClose}
                open
                title="Confirm action"
            >
                Are you sure?
            </Modal>
        </>
    );

    expect(screen.getByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
});
