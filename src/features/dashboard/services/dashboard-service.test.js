import { beforeEach, expect, test, vi } from "vitest";

const firestore = vi.hoisted(() => ({
    collection: vi.fn(() => "conversations-ref"),
    getDocs: vi.fn(),
    limit: vi.fn((value) => ["limit", value]),
    query: vi.fn((...parts) => parts),
    where: vi.fn((...parts) => ["where", ...parts])
}));
const communities = vi.hoisted(() => ({
    getCommunityMembershipIds: vi.fn()
}));

vi.mock("firebase/firestore", () => firestore);
vi.mock("../../../firebase/index.js", () => ({ db: "db" }));
vi.mock("../../../services/community-service.js", () => communities);

import { getDashboard } from "./dashboard-service.js";

beforeEach(() => {
    vi.clearAllMocks();
    communities.getCommunityMembershipIds.mockResolvedValue([
        "community-1",
        "community-2"
    ]);
    firestore.getDocs
        .mockResolvedValueOnce({
            docs: [
                {
                    data: () => ({ unreadCounts: { "user-1": 3 } }),
                    id: "direct-1"
                }
            ]
        })
        .mockResolvedValueOnce({
            docs: [
                {
                    data: () => ({ unreadCounts: { "user-1": 2 } }),
                    id: "group-1"
                }
            ]
        });
});

test("loads community and unread-message stats from Firebase data", async () => {
    const dashboard = await getDashboard("user-1");

    expect(communities.getCommunityMembershipIds).toHaveBeenCalledWith(
        "user-1"
    );
    expect(dashboard.stats).toEqual({ communities: 2, messages: 5 });
    expect(firestore.getDocs).toHaveBeenCalledTimes(2);
});

test("does not provide placeholder feature data", async () => {
    const dashboard = await getDashboard(null);

    expect(dashboard).not.toHaveProperty("focusTask");
    expect(dashboard).not.toHaveProperty("deadlines");
    expect(dashboard.stats).toEqual({ communities: 0, messages: 0 });
    expect(dashboard.activity).toEqual([]);
    expect(firestore.getDocs).not.toHaveBeenCalled();
});
