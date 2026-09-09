import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    loadCandidates: vi.fn(),
    openAssistant: vi.fn(),
    suggest: vi.fn()
}));

vi.mock("../../aiAssistant/components/AIAssistantDialog.jsx", () => ({
    default: () => null
}));
vi.mock("../../aiAssistant/hooks/useAIAssistant.js", () => ({
    useAIAssistant: () => ({
        action: "EXPLAIN_TOPIC",
        closeAssistant: vi.fn(),
        context: null,
        conversationMessages: [],
        newConversation: vi.fn(),
        open: false,
        openAssistant: mocks.openAssistant,
        retry: vi.fn(),
        run: vi.fn(),
        save: vi.fn()
    })
}));
vi.mock("../services/collection-study-context.js", () => ({
    createCollectionStudyContext: vi.fn().mockResolvedValue({
        content: "Collection context",
        id: "collection:community-1:collection-1",
        title: "Calculus Exam Prep"
    })
}));
vi.mock("../../../services/community-reputation-service.js", () => ({
    subscribeCommunityReputation: (_communityId, _userId, onData) => {
        onData({ trustRank: 0 });
        return vi.fn();
    }
}));
vi.mock("../services/knowledge-collection-service.js", () => ({
    createKnowledgeCollection: vi.fn(),
    deleteKnowledgeCollection: vi.fn(),
    loadKnowledgeCollectionCandidates: mocks.loadCandidates,
    reviewCollectionSuggestion: vi.fn(),
    subscribeCollectionSaved: (
        _communityId,
        _collectionId,
        _userId,
        onData
    ) => {
        onData(true);
        return vi.fn();
    },
    subscribeCollectionSuggestions: vi.fn(),
    subscribeKnowledgeCollections: (_communityId, onData) => {
        onData([
            {
                contributors: [{ displayName: "Neo", userId: "user-2" }],
                description: "Everything needed for the limits exam.",
                id: "collection-1",
                itemCount: 1,
                items: [
                    {
                        content: "Limits become stable near a point.",
                        id: "answer:q1:a1",
                        sourceId: "q1:a1",
                        sourceType: "answer",
                        title: "Understanding limits"
                    }
                ],
                tags: ["calculus", "limits"],
                title: "Calculus Exam Prep"
            }
        ]);
        return vi.fn();
    },
    suggestCollectionItem: mocks.suggest,
    toggleCollectionSaved: vi.fn(),
    updateKnowledgeCollection: vi.fn()
}));

import CommunityKnowledgeCollections from "./CommunityKnowledgeCollections.jsx";

test("shows a saved community collection and lets a member suggest material or study with Thuto", async () => {
    mocks.loadCandidates.mockResolvedValue([
        {
            id: "resource:file-1",
            sourceId: "file-1",
            sourceType: "resource",
            title: "Limits notes"
        }
    ]);
    mocks.suggest.mockResolvedValue("suggestion-1");
    render(
        <CommunityKnowledgeCollections
            actor={{
                communityId: "community-1",
                displayName: "Mia",
                id: "user-1"
            }}
            role="member"
        />
    );

    expect(screen.getAllByText("Calculus Exam Prep").length).toBeGreaterThan(0);
    expect(screen.getByText("Saved ✓")).toBeInTheDocument();
    expect(screen.queryByText("Delete collection")).not.toBeInTheDocument();

    fireEvent.click(
        screen.getByRole("button", {
            name: "Study this collection with Thuto"
        })
    );
    await waitFor(() => expect(mocks.openAssistant).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Suggest material" }));
    await screen.findByLabelText("Material to suggest");
    fireEvent.click(screen.getByRole("button", { name: "Send suggestion" }));
    await waitFor(() => expect(mocks.suggest).toHaveBeenCalled());
});
