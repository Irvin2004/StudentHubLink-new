import {
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const library = vi.hoisted(() => ({
    addResourceToPlanner: vi.fn(),
    destinations: [],
    deckResources: [],
    downloadResource: vi.fn(),
    error: null,
    favorites: {},
    loading: false,
    openResource: vi.fn(),
    pendingFavorites: [],
    plannerResources: [],
    reload: vi.fn(),
    resources: [],
    runResourceAction: vi.fn(),
    toggleFavorite: vi.fn()
}));
const session = vi.hoisted(() => ({ startSession: vi.fn() }));
const conversations = vi.hoisted(() => ({
    addThutoMessage: vi.fn(),
    loadThutoConversation: vi.fn(),
    startNewThutoConversation: vi.fn()
}));
const memory = vi.hoisted(() => ({
    loadLearningMemory: vi.fn(),
    recordThutoLearningMemory: vi.fn()
}));

vi.mock("../studySessions/context/study-session-context.js", () => ({
    useStudySession: () => session
}));
vi.mock("../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));
vi.mock(
    "../aiAssistant/services/thuto-conversation-service.js",
    () => conversations
);
vi.mock("../learningMemory/services/learning-memory-service.js", () => memory);

vi.mock("./hooks/useResourceLibrary.js", () => ({
    useResourceLibrary: () => library
}));
vi.mock("../../components/files/FilePreview/FilePreview.jsx", () => ({
    default: ({ file }) => (file ? <div>Previewing {file.title}</div> : null)
}));
vi.mock("../../components/files/FileUploader/FileUploader.jsx", () => ({
    default: ({ channelId, communityId }) => (
        <div>Uploading to {`${communityId}/${channelId}`}</div>
    )
}));

import ResourceLibraryPage from "./ResourceLibraryPage.jsx";
import { AI_ACTIONS } from "../aiAssistant/config/ai-action-types.js";

const resources = [
    {
        communityId: "science",
        communityName: "Science Club",
        content:
            "Acceleration is the rate at which velocity changes over time. Velocity describes motion in a direction.",
        extension: "pdf",
        id: "file-1",
        originalName: "Motion notes.pdf",
        resourceKey: "science:general:file-1",
        size: 2048,
        title: "Motion notes",
        uploadedAt: new Date("2026-08-08"),
        uploadedByName: "Ari"
    },
    {
        communityId: "maths",
        communityName: "Maths Club",
        extension: "xlsx",
        id: "file-2",
        originalName: "Algebra sheet.xlsx",
        resourceKey: "maths:general:file-2",
        size: 4096,
        title: "Algebra sheet",
        uploadedAt: new Date("2026-08-09"),
        uploadedByName: "Sam"
    }
];

beforeEach(() => {
    vi.clearAllMocks();
    conversations.loadThutoConversation.mockResolvedValue({
        messages: [],
        threadId: "thread-1"
    });
    conversations.addThutoMessage.mockImplementation(
        async (_userId, _resource, threadId, message) => ({
            ...message,
            createdAt: new Date(),
            id: `message-${conversations.addThutoMessage.mock.calls.length}`,
            threadId
        })
    );
    conversations.startNewThutoConversation.mockResolvedValue({
        messages: [],
        threadId: "thread-2"
    });
    memory.loadLearningMemory.mockResolvedValue({
        notices: [],
        prompt: "",
        topics: []
    });
    memory.recordThutoLearningMemory.mockResolvedValue([]);
    window.history.replaceState({}, "", "/app/resources");
    Object.assign(library, {
        error: null,
        destinations: [],
        deckResources: [],
        favorites: {},
        loading: false,
        pendingFavorites: [],
        plannerResources: [],
        resources
    });
});

test("filters resources and switches between grid and list views", () => {
    render(<ResourceLibraryPage />);

    expect(screen.getByText("2 resources")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search resources"), {
        target: { value: "motion" }
    });
    expect(screen.getByText("1 resource")).toBeInTheDocument();
    expect(screen.queryByText("Algebra sheet")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "List" }));
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
        "aria-pressed",
        "true"
    );
});

test("connects preview, download, favourite, and planner actions", () => {
    render(<ResourceLibraryPage />);

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByText("Previewing Motion notes")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Download" })[1]);
    fireEvent.click(
        screen.getByRole("button", {
            name: "Add Motion notes to favourites"
        })
    );
    fireEvent.click(
        screen.getAllByRole("button", { name: "Add to Study Planner" })[1]
    );
    fireEvent.click(
        screen.getAllByRole("button", { name: "Create Flashcard Deck" })[1]
    );

    expect(library.runResourceAction).toHaveBeenCalledWith(
        "open",
        resources[0]
    );
    expect(library.runResourceAction).toHaveBeenCalledWith(
        "download",
        resources[0]
    );
    expect(library.runResourceAction).toHaveBeenCalledWith(
        "toggle-favorite",
        resources[0]
    );
    expect(library.runResourceAction).toHaveBeenCalledWith(
        "add-to-planner",
        resources[0]
    );
    expect(library.runResourceAction).toHaveBeenCalledWith(
        "create-flashcard-deck",
        resources[0]
    );
});

test("starts a study session from a resource", () => {
    render(<ResourceLibraryPage />);

    const resourceCard = screen
        .getByRole("heading", { name: "Motion notes" })
        .closest("article");
    fireEvent.click(
        within(resourceCard).getByRole("button", { name: "Start Session" })
    );

    expect(session.startSession).toHaveBeenCalledWith({
        resourceId: "science:general:file-1",
        sourceType: "resource",
        subject: "Science Club",
        title: "Motion notes"
    });
});

test("opens Thuto with the selected resource as context", async () => {
    render(<ResourceLibraryPage />);

    const motionResource = screen
        .getByRole("heading", { name: "Motion notes" })
        .closest("article");
    fireEvent.click(
        within(motionResource).getByRole("button", { name: "Study with Thuto" })
    );

    expect(
        await screen.findByRole("dialog", {
            name: "Thuto — Your Learning Companion"
        })
    ).toBeVisible();
    expect(
        screen.getByLabelText("Active Thuto study materials")
    ).toHaveTextContent("Motion notes");
    expect(
        screen.getByRole("textbox", { name: "Study context" }).value
    ).toContain("Acceleration is the rate");

    fireEvent.change(screen.getByLabelText("Thuto action"), {
        target: { value: AI_ACTIONS.ASK_QUESTION }
    });
    fireEvent.change(
        screen.getByRole("textbox", {
            name: "Question about this resource"
        }),
        { target: { value: "What is acceleration?" } }
    );
    await waitFor(() =>
        expect(
            screen.getByRole("button", { name: "Ask a Question" })
        ).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Ask a Question" }));

    const answerHeading = await screen.findByRole("heading", {
        name: "Answer from Motion notes"
    });
    expect(answerHeading).toBeVisible();
    expect(
        within(answerHeading.closest("section")).getByText(
            /Acceleration is the rate/
        )
    ).toBeVisible();
    expect(library.runResourceAction).toHaveBeenCalledWith(
        "open",
        resources[0]
    );
});

test("adds and removes active Thuto study materials without mixing sets", async () => {
    render(<ResourceLibraryPage />);

    const motionResource = screen
        .getByRole("heading", { name: "Motion notes" })
        .closest("article");
    fireEvent.click(
        within(motionResource).getByRole("button", { name: "Study with Thuto" })
    );

    const activeMaterials = await screen.findByLabelText(
        "Active Thuto study materials"
    );
    fireEvent.click(
        within(activeMaterials).getByRole("button", {
            name: "Add study material"
        })
    );
    fireEvent.click(
        within(activeMaterials).getByRole("button", {
            name: "Add selected material"
        })
    );

    await waitFor(() => {
        const materials = screen.getByLabelText("Active Thuto study materials");
        expect(within(materials).getByText("Motion notes")).toBeVisible();
        expect(within(materials).getByText("Algebra sheet")).toBeVisible();
    });
    expect(
        screen.getByRole("textbox", { name: "Study context" }).value
    ).toContain("Study material 2: Algebra sheet");
    expect(conversations.loadThutoConversation).toHaveBeenLastCalledWith(
        "user-1",
        expect.objectContaining({
            id: expect.stringContaining("set:"),
            resources: expect.arrayContaining([
                expect.objectContaining({ id: "science:general:file-1" }),
                expect.objectContaining({ id: "maths:general:file-2" })
            ])
        })
    );

    fireEvent.click(
        screen.getByRole("button", { name: "Remove Motion notes" })
    );
    await waitFor(() =>
        expect(
            screen.getByLabelText("Active Thuto study materials")
        ).toHaveTextContent("Algebra sheet")
    );
    expect(
        screen.getByLabelText("Active Thuto study materials")
    ).not.toHaveTextContent("Motion notes");
    expect(
        screen.getByRole("textbox", { name: "Study context" }).value
    ).not.toContain("Acceleration is the rate");
    expect(conversations.loadThutoConversation).toHaveBeenLastCalledWith(
        "user-1",
        expect.objectContaining({ id: "maths:general:file-2" })
    );
});

test("opens and highlights a supported resource deep link", async () => {
    window.history.replaceState(
        {},
        "",
        "/resources?resource=science%3Ageneral%3Afile-1"
    );
    render(<ResourceLibraryPage />);

    await waitFor(() =>
        expect(screen.getByText("Previewing Motion notes")).toBeVisible()
    );
    expect(
        screen.getByRole("heading", { name: "Motion notes" }).closest("article")
    ).toHaveAttribute("aria-current", "true");
    expect(library.runResourceAction).toHaveBeenCalledWith(
        "open",
        resources[0]
    );
});

test("falls back to download for unsupported resource deep links", async () => {
    window.history.replaceState(
        {},
        "",
        "/resources?resource=maths%3Ageneral%3Afile-2"
    );
    render(<ResourceLibraryPage />);

    await waitFor(() =>
        expect(library.runResourceAction).toHaveBeenCalledWith(
            "download",
            resources[1]
        )
    );
    expect(
        screen.queryByText("Previewing Algebra sheet")
    ).not.toBeInTheDocument();
});

test("shows loading, error, and empty states", () => {
    library.loading = true;
    const { rerender } = render(<ResourceLibraryPage />);
    expect(screen.getByRole("status", { name: "Loading files" })).toBeVisible();

    library.loading = false;
    library.error = new Error("offline");
    rerender(<ResourceLibraryPage />);
    expect(screen.getByText("Resource library unavailable")).toBeVisible();

    library.error = null;
    library.resources = [];
    rerender(<ResourceLibraryPage />);
    expect(screen.getByText("No resources yet")).toBeVisible();
});

test("shows favourites and uploads through a real community destination", () => {
    Object.assign(library, {
        destinations: [
            {
                channelId: "general",
                channelName: "General",
                communityId: "science",
                communityName: "Science Club"
            }
        ],
        favorites: { "science:general:file-1": "favorite-1" }
    });
    render(<ResourceLibraryPage />);

    expect(
        screen.getByRole("heading", { name: "Favourite Resources" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Upload Resource" }));

    expect(screen.getByText("Uploading to science/general")).toBeVisible();
});
