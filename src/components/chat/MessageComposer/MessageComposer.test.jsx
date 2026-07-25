import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import MessageComposer from "./MessageComposer.jsx";

describe("MessageComposer", () => {
    test("sends with Enter and includes a reply reference", async () => {
        const onSend = vi.fn().mockResolvedValue();
        render(
            <MessageComposer
                channelName="general"
                onCancelReply={vi.fn()}
                onSend={onSend}
                reply={{
                    id: "message-0",
                    senderName: "Alex",
                    text: "Can someone share the assignment?"
                }}
            />
        );

        const input = screen.getByLabelText("Message general");
        fireEvent.change(input, { target: { value: "Here it is" } });
        fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

        await waitFor(() =>
            expect(onSend).toHaveBeenCalledWith(
                "Here it is",
                expect.objectContaining({
                    replyTo: expect.objectContaining({ id: "message-0" })
                })
            )
        );
        expect(input).toHaveValue("");
    });

    test("keeps a newline on Shift + Enter and disables empty sends", () => {
        const onSend = vi.fn();
        render(<MessageComposer channelName="general" onSend={onSend} />);

        expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
        fireEvent.keyDown(screen.getByLabelText("Message general"), {
            key: "Enter",
            shiftKey: true
        });
        expect(onSend).not.toHaveBeenCalled();
    });
});
