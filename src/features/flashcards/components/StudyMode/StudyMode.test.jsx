import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { StudyMode } from "./StudyMode.jsx";

const deck = {
    id: "deck-1",
    subject: "Robotics",
    title: "Robotics Fundamentals"
};
const cards = [
    {
        back: "A feedback controller.",
        front: "What is a PID controller?",
        id: "card-1"
    },
    {
        back: "A device that detects its environment.",
        front: "What is a sensor?",
        id: "card-2"
    }
];

beforeEach(() => {
    window.sessionStorage.clear();
});

afterEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
});

test("shows one card front first and flips with Space", () => {
    render(<StudyMode cards={cards} deck={deck} onClose={vi.fn()} />);

    expect(screen.getByText(cards[0].front)).toBeVisible();
    expect(screen.queryByText(cards[0].back)).not.toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeVisible();
    expect(screen.getByText("0 reviewed")).toBeVisible();

    fireEvent.keyDown(window, { code: "Space", key: " " });

    expect(screen.getByText(cards[0].back)).toBeVisible();
    expect(screen.getByText("1 reviewed")).toBeVisible();
    expect(screen.getByRole("button", { name: "Good" })).toBeVisible();
});

test("navigates with controls and arrow shortcuts without double-counting", async () => {
    render(<StudyMode cards={cards} deck={deck} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    fireEvent.click(screen.getByRole("button", { name: "Good" }));
    await waitFor(() =>
        expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute(
            "aria-pressed",
            "true"
        )
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(cards[1].front)).toBeVisible();
    expect(screen.getByText("2 / 2")).toBeVisible();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { code: "Space", key: " " });
    expect(screen.getByText("1 reviewed")).toBeVisible();
    expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute(
        "aria-pressed",
        "true"
    );
});

test("persists ratings and summarizes a due-card review", async () => {
    const onRate = vi.fn(async (cardId, rating) => ({
        ...cards.find((card) => card.id === cardId),
        easeRating: rating.toLowerCase(),
        nextReviewAt: new Date(2026, 7, rating === "Again" ? 10 : 13),
        reviewCount: 1
    }));
    render(
        <StudyMode
            allCards={cards}
            cards={cards}
            deck={deck}
            onClose={vi.fn()}
            onRate={onRate}
            reviewDueOnly
        />
    );

    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    fireEvent.click(screen.getByRole("button", { name: "Good" }));
    await waitFor(() => expect(onRate).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    fireEvent.click(screen.getByRole("button", { name: "Again" }));
    await waitFor(() => expect(onRate).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Finish Session" }));

    expect(screen.getByText("Review complete")).toBeVisible();
    expect(screen.getByText("Due cards reviewed")).toBeVisible();
    expect(screen.getByText("Cards remaining")).toBeVisible();
    expect(screen.getByText("Next review")).toBeVisible();
});

test("shows reviewed cards, elapsed time, and completion when the deck ends", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(1_000).mockReturnValue(61_000);
    render(<StudyMode cards={cards} deck={deck} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    fireEvent.click(screen.getByRole("button", { name: "Finish Session" }));

    expect(screen.getByText("Nice work!")).toBeVisible();
    expect(screen.getByText("2 / 2")).toBeVisible();
    expect(screen.getByText("1:00")).toBeVisible();
    expect(screen.getByText("100%")).toBeVisible();
});

test("returns to deck management from study mode", () => {
    const onClose = vi.fn();
    render(<StudyMode cards={cards} deck={deck} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Exit Study" }));
    expect(onClose).toHaveBeenCalledOnce();
});

test("restores position, flip state, and local ratings after remount", async () => {
    const onRate = vi.fn(async (cardId, rating) => ({
        ...cards.find((card) => card.id === cardId),
        easeRating: rating.toLowerCase()
    }));
    const firstRender = render(
        <StudyMode
            cards={cards}
            deck={deck}
            onClose={vi.fn()}
            onRate={onRate}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    fireEvent.keyDown(window, { key: "3" });
    await waitFor(() => expect(onRate).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    firstRender.unmount();

    render(
        <StudyMode
            cards={cards}
            deck={deck}
            onClose={vi.fn()}
            onRate={onRate}
        />
    );
    expect(screen.getByText("2 / 2")).toBeVisible();
    expect(screen.getByText(cards[1].back)).toBeVisible();
    expect(screen.getByText("2 reviewed")).toBeVisible();
});

test("guards a rating from duplicate writes", async () => {
    let resolveRating;
    const onRate = vi.fn(
        () => new Promise((resolve) => (resolveRating = resolve))
    );
    render(
        <StudyMode
            cards={cards}
            deck={deck}
            onClose={vi.fn()}
            onRate={onRate}
        />
    );
    fireEvent.click(screen.getByRole("button", { name: /Card front/ }));
    const good = screen.getByRole("button", { name: "Good" });
    fireEvent.click(good);
    fireEvent.click(good);
    expect(onRate).toHaveBeenCalledOnce();
    resolveRating(cards[0]);
    await waitFor(() => expect(good).not.toBeDisabled());
});
