import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import MessageList from "../chat/MessageList/MessageList.jsx";
import FileList from "../files/FileList/FileList.jsx";
import ActivityFeed from "../notifications/ActivityFeed/ActivityFeed.jsx";

const MESSAGE_LIST_PROPS = {
    currentUserId: "user-1",
    hasOlder: false,
    loadingOlder: false,
    messages: [],
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onLoadOlder: vi.fn(),
    onReact: vi.fn(),
    onReply: vi.fn(),
    role: "member"
};

describe("async community content states", () => {
    afterEach(cleanup);

    test.each([
        ["messages", <MessageList {...MESSAGE_LIST_PROPS} loading />],
        [
            "files",
            <FileList
                currentUserId="user-1"
                files={[]}
                loading
                onDelete={vi.fn()}
                onDownload={vi.fn()}
                role="member"
            />
        ],
        ["community activity", <ActivityFeed activities={[]} loading />]
    ])("announces the %s loading state", (name, view) => {
        render(view);
        expect(
            screen.getByRole("status", {
                name: new RegExp(`loading ${name}`, "i")
            })
        ).toHaveAttribute("aria-busy", "true");
    });

    test.each([
        [
            "Messages unavailable",
            <MessageList
                {...MESSAGE_LIST_PROPS}
                error={new Error("Failed")}
                loading={false}
            />
        ],
        [
            "Files unavailable",
            <FileList
                currentUserId="user-1"
                error={new Error("Failed")}
                files={[]}
                loading={false}
                onDelete={vi.fn()}
                onDownload={vi.fn()}
                role="member"
            />
        ],
        [
            "Activity unavailable",
            <ActivityFeed
                activities={[]}
                error={new Error("Failed")}
                loading={false}
            />
        ]
    ])("renders the %s error state", (title, view) => {
        render(view);
        expect(screen.getByRole("alert")).toHaveTextContent(title);
    });
});
