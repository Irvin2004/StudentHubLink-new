import { describe, expect, test } from "vitest";

import {
    prepareGeneratedStudyPlan,
    validateGeneratedStudyPlan
} from "./generated-study-plan.js";

describe("generated Thuto study-plan review", () => {
    test("prepares editable tasks and keeps a real linked resource", () => {
        const tasks = prepareGeneratedStudyPlan({
            resourceId: "math:general:file-1",
            subject: "Calculus",
            tasks: [
                {
                    dueDate: "2026-09-06",
                    estimatedMinutes: 30,
                    notes: "Review limits",
                    priority: "High",
                    title: "Limits practice"
                }
            ]
        });

        expect(tasks[0]).toEqual(
            expect.objectContaining({
                resourceId: "math:general:file-1",
                selected: true,
                subject: "Calculus"
            })
        );
    });

    test("does not turn a collection context ID into a resource link", () => {
        const [task] = prepareGeneratedStudyPlan({
            resourceId: "collection:math:exam-prep:set:materials",
            subject: "Calculus",
            tasks: [
                {
                    dueDate: "2026-09-06",
                    estimatedMinutes: 30,
                    priority: "Medium",
                    title: "Review collection"
                }
            ]
        });

        expect(task.resourceId).toBe("");
    });

    test("returns only selected, valid planner task inputs", () => {
        const tasks = validateGeneratedStudyPlan([
            {
                dueDate: "2026-09-06",
                estimatedMinutes: "45",
                id: "one",
                notes: "Practise",
                priority: "High",
                selected: true,
                subject: "Calculus",
                title: "Limits"
            },
            {
                dueDate: "2026-09-07",
                estimatedMinutes: 30,
                id: "two",
                priority: "Low",
                selected: false,
                subject: "Calculus",
                title: "Skip this"
            }
        ]);

        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toEqual(
            expect.objectContaining({
                estimatedMinutes: 45,
                title: "Limits"
            })
        );
        expect(tasks[0]).not.toHaveProperty("selected");
    });

    test("rejects an empty review selection", () => {
        expect(() => validateGeneratedStudyPlan([{ selected: false }])).toThrow(
            "Select at least one task"
        );
    });
});
