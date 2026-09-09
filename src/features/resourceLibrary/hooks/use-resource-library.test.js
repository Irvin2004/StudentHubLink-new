import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const service = vi.hoisted(() => ({
    addStudyTask: vi.fn(),
    createFlashcardDeck: vi.fn(),
    downloadFile: vi.fn(),
    getResourceLibraryData: vi.fn(),
    getMoreResourceLibraryData: vi.fn(),
    recordResourceOpened: vi.fn(),
    setResourceFavorite: vi.fn(),
    showToast: vi.fn()
}));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));
vi.mock("../../../hooks/useToast.js", () => ({
    useToast: () => ({ showToast: service.showToast })
}));
vi.mock("../../../services/file-service.js", () => ({
    downloadFile: service.downloadFile,
    getResourceLibraryData: service.getResourceLibraryData,
    getMoreResourceLibraryData: service.getMoreResourceLibraryData,
    recordResourceOpened: service.recordResourceOpened,
    setResourceFavorite: service.setResourceFavorite
}));
vi.mock("../../studyPlanner/services/study-planner-service.js", () => ({
    addStudyTask: service.addStudyTask
}));
vi.mock("../../flashcards/services/flashcard-service.js", () => ({
    createFlashcardDeck: service.createFlashcardDeck
}));

import { useResourceLibrary } from "./useResourceLibrary.js";

const resource = {
    communityName: "Physics",
    originalName: "Motion notes.pdf",
    resourceKey: "physics:general:file-1",
    title: "Motion notes"
};

beforeEach(() => {
    vi.clearAllMocks();
    service.getResourceLibraryData.mockResolvedValue({
        cursors: {},
        destinations: [],
        favorites: {},
        hasMore: false,
        resources: [resource]
    });
    service.setResourceFavorite.mockResolvedValue("favorite-1");
    service.addStudyTask.mockResolvedValue({ id: "task-1" });
    service.createFlashcardDeck.mockResolvedValue({
        id: "deck-1",
        title: "Motion notes"
    });
});

test("loads resources and favourites through the file service", async () => {
    const { result } = renderHook(() => useResourceLibrary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(service.getResourceLibraryData).toHaveBeenCalledWith("user-1");
    expect(result.current.resources).toEqual([resource]);
});

test("favourites a resource and creates a study task", async () => {
    const { result } = renderHook(() => useResourceLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.toggleFavorite(resource));
    expect(service.setResourceFavorite).toHaveBeenCalledWith(
        "user-1",
        resource.resourceKey,
        undefined
    );
    expect(result.current.favorites[resource.resourceKey]).toBe("favorite-1");

    await act(() => result.current.addResourceToPlanner(resource));
    expect(service.addStudyTask).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
            estimatedMinutes: 30,
            notes: "Study resource: Motion notes.pdf",
            priority: "Medium",
            resourceId: resource.resourceKey,
            subject: "Physics",
            title: "Review Motion notes"
        })
    );
    expect(service.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
    );
});

test("persists resource opens", async () => {
    const { result } = renderHook(() => useResourceLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.openResource(resource));

    expect(service.recordResourceOpened).toHaveBeenCalledWith(
        "user-1",
        resource.resourceKey
    );
    expect(result.current.resources[0].lastOpened).toBeInstanceOf(Date);
});

test("creates a flashcard deck linked to a resource", async () => {
    const { result } = renderHook(() => useResourceLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.createDeckFromResource(resource));

    expect(service.createFlashcardDeck).toHaveBeenCalledWith("user-1", {
        resourceId: resource.resourceKey,
        subject: "Physics",
        title: "Motion notes"
    });
});

test("restores persisted favourites after a refresh", async () => {
    service.getResourceLibraryData.mockResolvedValue({
        destinations: [],
        favorites: { [resource.resourceKey]: "favorite-1" },
        resources: [{ ...resource, favoriteAt: new Date() }]
    });
    const { result } = renderHook(() => useResourceLibrary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.favorites).toEqual({
        [resource.resourceKey]: "favorite-1"
    });
});

test("routes card actions through one shared handler", async () => {
    const { result } = renderHook(() => useResourceLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() =>
        result.current.runResourceAction("toggle-favorite", resource)
    );
    await act(() =>
        result.current.runResourceAction("add-to-planner", resource)
    );

    expect(service.setResourceFavorite).toHaveBeenCalledOnce();
    expect(service.addStudyTask).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ resourceId: resource.resourceKey })
    );
});

test("loads resource pages once and merges unique resources", async () => {
    const nextResource = {
        ...resource,
        resourceKey: "physics:general:file-2",
        title: "Forces"
    };
    service.getResourceLibraryData.mockResolvedValue({
        cursors: { "physics/general": { id: "file-1" } },
        destinations: [
            {
                communityId: "physics",
                communityName: "Physics",
                channelId: "general",
                channelName: "General"
            }
        ],
        favorites: {},
        hasMore: true,
        resources: [resource]
    });
    let resolvePage;
    service.getMoreResourceLibraryData.mockReturnValue(
        new Promise((resolve) => {
            resolvePage = resolve;
        })
    );
    const { result } = renderHook(() => useResourceLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let firstRequest;
    let duplicateRequest;
    act(() => {
        firstRequest = result.current.loadMore();
        duplicateRequest = result.current.loadMore();
    });
    expect(service.getMoreResourceLibraryData).toHaveBeenCalledOnce();

    await act(async () => {
        resolvePage({
            cursors: { "physics/general": null },
            hasMore: false,
            resources: [resource, nextResource]
        });
        await firstRequest;
        await duplicateRequest;
    });
    expect(result.current.resources).toEqual([resource, nextResource]);
});
