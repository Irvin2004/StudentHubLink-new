import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { StudyHistory } from "./StudyHistory.jsx";

const sessions = [
    {
        actualMinutes: 45,
        completedAt: new Date("2026-08-10T09:00:00"),
        id: "robotics",
        subject: "Robotics",
        title: "Robot fundamentals"
    },
    {
        actualMinutes: 30,
        completedAt: new Date("2026-08-11T09:00:00"),
        id: "programming",
        subject: "Programming",
        title: "JavaScript practice"
    }
];

test("filters study history by subject and date", () => {
    render(<StudyHistory sessions={sessions} />);

    fireEvent.change(screen.getByLabelText("Subject"), {
        target: { value: "Robotics" }
    });
    expect(screen.getByText("Robot fundamentals")).toBeVisible();
    expect(screen.queryByText("JavaScript practice")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Date"), {
        target: { value: "2026-08-11" }
    });
    expect(screen.getByText("No sessions match these filters")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
    expect(screen.getByText("Robot fundamentals")).toBeVisible();
    expect(screen.getByText("JavaScript practice")).toBeVisible();
});
