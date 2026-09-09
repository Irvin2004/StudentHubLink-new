import {
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const flashcards = vi.hoisted(() => ({
    addCard: vi.fn().mockResolvedValue({ id: "card-new" }),
    addDeck: vi.fn().mockResolvedValue({ id: "deck-new" }),
    cards: [],
    cardsError: null,
    cardsLoading: false,
    decks: [],
    editCard: vi.fn().mockResolvedValue(true),
    error: null,
    finishStudy: vi.fn().mockResolvedValue(true),
    loading: false,
    mutationError: null,
    rateCard: vi.fn().mockResolvedValue({}),
    reload: vi.fn(),
    removeCard: vi.fn().mockResolvedValue(true),
    removeDeck: vi.fn().mockResolvedValue(true),
    selectDeck: vi.fn(),
    selectedDeck: null
}));

vi.mock("./hooks/useFlashcards.js", () => ({
    useFlashcards: () => flashcards
}));

import FlashcardsPage from "./FlashcardsPage.jsx";

const deck = {
    cardCount: 1,
    dueCount: 1,
    id: "deck-1",
    subject: "Robotics",
    title: "Robotics Fundamentals"
};
const card = {
    back: "It regulates a process using proportional, integral, and derivative terms.",
    front: "What does a PID controller do?",
    id: "card-1"
};

beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/app/flashcards");
    Object.assign(flashcards, {
        cards: [card],
        cardsError: null,
        cardsLoading: false,
        decks: [deck],
        error: null,
        loading: false,
        linkedQuizzes: [],
        mutationError: null,
        selectedDeck: deck
    });
});

test("opens a quiz linked to the selected flashcard deck", () => {
    flashcards.linkedQuizzes = [
        { flashcardDeckId: "deck-1", id: "quiz-1", title: "Robotics Quiz" }
    ];
    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Open Linked Quiz" }));
    expect(window.location.search).toBe("?quiz=quiz-1");
});

test("opens a linked deck directly in due-review mode", async () => {
    window.history.replaceState({}, "", "/app/flashcards?deck=deck-1&mode=due");
    render(<FlashcardsPage />);

    await waitFor(() =>
        expect(screen.getByRole("button", { name: "Exit Study" })).toBeVisible()
    );
    expect(screen.getByText(card.front)).toBeVisible();
});

test("selects the correct deck from a plain deep link", async () => {
    flashcards.selectedDeck = null;
    flashcards.cards = [];
    window.history.replaceState({}, "", "/flashcards?deck=deck-1");
    render(<FlashcardsPage />);

    await waitFor(() =>
        expect(flashcards.selectDeck).toHaveBeenCalledWith("deck-1")
    );
});

test("shows decks, card counts, and both sides of selected cards", () => {
    render(<FlashcardsPage />);

    expect(screen.getAllByText("Robotics Fundamentals")).toHaveLength(2);
    expect(screen.getByText("1 card")).toBeVisible();
    expect(screen.getByText("Mastery")).toBeVisible();
    expect(screen.getByText(card.front)).toBeVisible();
    expect(screen.getByText(card.back)).toBeVisible();

    fireEvent.click(
        screen.getByRole("button", { name: /Robotics Fundamentals Cards/ })
    );
    expect(flashcards.selectDeck).toHaveBeenCalledWith("deck-1");
});

test("starts a study session for the selected deck", () => {
    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Start Studying" }));

    expect(screen.getByRole("heading", { name: deck.title })).toBeVisible();
    expect(screen.getByText(card.front)).toBeVisible();
    expect(screen.queryByText(card.back)).not.toBeInTheDocument();
});

test("shows the due count and starts a due-only review", () => {
    render(<FlashcardsPage />);

    expect(screen.getAllByText("Due")).toHaveLength(2);
    fireEvent.click(
        screen.getByRole("button", { name: "Review Due Cards (1)" })
    );

    expect(screen.getByText(card.front)).toBeVisible();
    expect(screen.getByRole("button", { name: "Exit Study" })).toBeVisible();
});

test("searches decks and filters by due status", () => {
    const caughtUpDeck = {
        cardCount: 2,
        dueCount: 0,
        id: "deck-2",
        subject: "Database",
        title: "SQL Basics"
    };
    flashcards.decks = [deck, caughtUpDeck];
    render(<FlashcardsPage />);

    fireEvent.change(screen.getByLabelText("Search decks"), {
        target: { value: "database" }
    });
    expect(
        screen.getByRole("button", { name: /SQL Basics Cards/ })
    ).toBeVisible();
    expect(
        screen.queryByRole("button", { name: /Robotics Fundamentals Cards/ })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search decks"), {
        target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Due" }));
    expect(
        screen.getByRole("button", { name: /Robotics Fundamentals Cards/ })
    ).toBeVisible();
    expect(
        screen.queryByRole("button", { name: /SQL Basics Cards/ })
    ).not.toBeInTheDocument();
});

test("creates a deck with a name and subject", async () => {
    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Deck" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Deck name/), {
        target: { value: "Database Fundamentals" }
    });
    fireEvent.change(within(dialog).getByLabelText(/^Subject/), {
        target: { value: "Database" }
    });
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Create Deck" })
    );

    await waitFor(() =>
        expect(flashcards.addDeck).toHaveBeenCalledWith({
            subject: "Database",
            title: "Database Fundamentals"
        })
    );
});

test("adds and edits cards", async () => {
    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
    let dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Front/), {
        target: { value: "New front" }
    });
    fireEvent.change(within(dialog).getByLabelText(/^Back/), {
        target: { value: "New back" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add Card" }));
    await waitFor(() =>
        expect(flashcards.addCard).toHaveBeenCalledWith({
            back: "New back",
            front: "New front"
        })
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Back/), {
        target: { value: "Updated back" }
    });
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Save Changes" })
    );
    await waitFor(() =>
        expect(flashcards.editCard).toHaveBeenCalledWith("card-1", {
            back: "Updated back",
            front: card.front
        })
    );
});

test("confirms card and deck deletion", async () => {
    render(<FlashcardsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    let dialog = screen.getByRole("dialog");
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Delete Card" })
    );
    await waitFor(() =>
        expect(flashcards.removeCard).toHaveBeenCalledWith("card-1")
    );

    fireEvent.click(
        screen.getByRole("button", {
            name: "Delete Robotics Fundamentals"
        })
    );
    dialog = screen.getByRole("dialog");
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Delete Deck" })
    );
    await waitFor(() =>
        expect(flashcards.removeDeck).toHaveBeenCalledWith("deck-1")
    );
});

test("shows loading, error, and empty deck states", () => {
    flashcards.loading = true;
    const { rerender } = render(<FlashcardsPage />);
    expect(screen.getByLabelText("Your Decks").parentElement).toBeTruthy();

    flashcards.loading = false;
    flashcards.error = new Error("offline");
    rerender(<FlashcardsPage />);
    expect(screen.getByText("Flashcard decks unavailable")).toBeVisible();

    flashcards.error = null;
    flashcards.decks = [];
    flashcards.selectedDeck = null;
    rerender(<FlashcardsPage />);
    expect(screen.getByText("No flashcard decks yet")).toBeVisible();
});
