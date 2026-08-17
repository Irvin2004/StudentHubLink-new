import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { TaskCard } from "./TaskCard.jsx";
import styles from "./TaskCard.module.css";

test("sends the task id when its checkbox is clicked", () => {
    const onToggle = vi.fn();

    render(
        <TaskCard
            onToggle={onToggle}
            task={{
                id: "calculus-review",
                title: "Calculus review",
                subject: "Mathematics",
                estimatedTime: "45 min",
                priority: "Medium",
                completed: false
            }}
        />
    );

    fireEvent.click(
        screen.getByRole("checkbox", {
            name: "Mark Calculus review complete"
        })
    );

    expect(onToggle).toHaveBeenCalledWith("calculus-review");
});

test("renders a completed task as checked with a struck-through title", () => {
    const { container } = render(
        <TaskCard
            onToggle={vi.fn()}
            task={{
                id: "calculus-review",
                title: "Calculus review",
                subject: "Mathematics",
                estimatedTime: "45 min",
                priority: "Medium",
                completed: true
            }}
        />
    );

    expect(
        screen.getByRole("checkbox", {
            name: "Mark Calculus review incomplete"
        })
    ).toBeChecked();
    expect(screen.getByText("Calculus review")).toHaveClass(
        styles.completedTitle
    );
    expect(container.querySelector("article")).toHaveClass(
        styles.completedCard
    );
});

test("sends the task when Delete is clicked", () => {
    const onDelete = vi.fn();
    const task = {
        id: "calculus-review",
        title: "Calculus review",
        subject: "Mathematics",
        notes: "Finish the practice set.",
        estimatedTime: "45 min",
        priority: "Medium",
        completed: false
    };

    render(<TaskCard onDelete={onDelete} task={task} />);

    expect(screen.getByText("Finish the practice set.")).toBeVisible();

    fireEvent.click(
        screen.getByRole("button", { name: "Delete Calculus review" })
    );

    expect(onDelete).toHaveBeenCalledWith(task);
});

test("sends the task when Edit is clicked", () => {
    const onEdit = vi.fn();
    const task = {
        id: "calculus-review",
        title: "Calculus review",
        subject: "Mathematics",
        estimatedTime: "45 min",
        priority: "Medium",
        completed: false
    };

    render(<TaskCard onEdit={onEdit} task={task} />);

    fireEvent.click(
        screen.getByRole("button", { name: "Edit Calculus review" })
    );

    expect(onEdit).toHaveBeenCalledWith(task);
});

test("opens a linked flashcard deck from a planner task", () => {
    const onStudyFlashcards = vi.fn();
    const task = {
        completed: false,
        estimatedTime: "30 min",
        flashcardDeckId: "deck-1",
        id: "flashcard-task",
        priority: "Medium",
        subject: "Robotics",
        title: "Study Robotics"
    };
    render(<TaskCard onStudyFlashcards={onStudyFlashcards} task={task} />);

    fireEvent.click(
        screen.getByRole("button", {
            name: "Study flashcards for Study Robotics"
        })
    );
    expect(onStudyFlashcards).toHaveBeenCalledWith(task);
});

test("opens a linked quiz from a planner task", () => {
    const onTakeQuiz = vi.fn();
    const task = {
        completed: false,
        estimatedTime: "20 min",
        id: "quiz-task",
        priority: "High",
        quizId: "quiz-1",
        subject: "Programming",
        taskType: "quiz",
        title: "Take Programming Quiz"
    };
    render(<TaskCard onTakeQuiz={onTakeQuiz} task={task} />);

    fireEvent.click(
        screen.getByRole("button", {
            name: "Take quiz for Take Programming Quiz"
        })
    );
    expect(onTakeQuiz).toHaveBeenCalledWith(task);
});
