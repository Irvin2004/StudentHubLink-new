import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { COMMUNITY_ROLES } from "../../../config/community-roles.js";
import MessageList from "./MessageList.jsx";

const messages = [
    {
        id: "message-1",
        senderId: "user-1",
        senderName: "Alex",
        text: "Can someone share the assignment?",
        createdAt: new Date("2026-07-25T09:00:00"),
        reactions: {},
        attachments: [],
        readBy: []
    },
    {
        id: "message-2",
        senderId: "user-2",
        senderName: "Maya",
        text: "I uploaded it.",
        createdAt: new Date("2026-07-25T09:05:00"),
        replyTo: {
            id: "message-1",
            senderName: "Alex",
            text: "Can someone share the assignment?"
        },
        reactions: { thumbsUp: ["user-1"] },
        attachments: [],
        readBy: []
    }
];

describe("MessageList", () => {
    test("renders grouped messages, replies, and reactions", () => {
        render(
            <MessageList
                currentUserId="user-1"
                messages={messages}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
                onLoadOlder={vi.fn()}
                onReact={vi.fn()}
                onReply={vi.fn()}
                role={COMMUNITY_ROLES.MEMBER}
            />
        );

        expect(
            screen.getAllByText("Can someone share the assignment?")
        ).toHaveLength(2);
        expect(screen.getByText("I uploaded it.")).toBeInTheDocument();
        expect(screen.getByLabelText("Message reactions")).toBeInTheDocument();
        expect(screen.getAllByText("Alex").length).toBeGreaterThan(1);
    });

    test("starts a reply from the message action", () => {
        const onReply = vi.fn();
        render(
            <MessageList
                currentUserId="user-1"
                messages={[messages[0]]}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
                onLoadOlder={vi.fn()}
                onReact={vi.fn()}
                onReply={onReply}
                role={COMMUNITY_ROLES.MEMBER}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Reply" }));
        expect(onReply).toHaveBeenCalledWith(messages[0]);
    });
});
