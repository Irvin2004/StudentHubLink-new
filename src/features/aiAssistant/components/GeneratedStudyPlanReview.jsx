import { useState } from "react";

import Button from "../../../components/ui/Button/index.js";
import Input from "../../../components/ui/Input/index.js";
import Select from "../../../components/ui/Select/index.js";
import Textarea from "../../../components/ui/Textarea/index.js";
import {
    prepareGeneratedStudyPlan,
    validateGeneratedStudyPlan
} from "../utils/generated-study-plan.js";
import styles from "./GeneratedStudyPlanReview.module.css";

export default function GeneratedStudyPlanReview({
    onBack,
    onConfirm,
    result,
    saveError,
    saving
}) {
    const [tasks, setTasks] = useState(() => prepareGeneratedStudyPlan(result));
    const [validationError, setValidationError] = useState("");
    const selectedCount = tasks.filter((task) => task.selected).length;

    function updateTask(taskId, field, value) {
        setTasks((current) =>
            current.map((task) =>
                task.id === taskId ? { ...task, [field]: value } : task
            )
        );
    }

    async function submit(event) {
        event.preventDefault();
        setValidationError("");
        try {
            const approvedTasks = validateGeneratedStudyPlan(tasks);
            await onConfirm({ ...result, tasks: approvedTasks });
        } catch (error) {
            setValidationError(
                error?.message || "Review the selected tasks and try again."
            );
        }
    }

    return (
        <section
            aria-label="Review generated study plan"
            className={styles.review}
        >
            <header>
                <div>
                    <span>Step 2 of 3 · Review</span>
                    <h3>Review your proposed tasks</h3>
                    <p>
                        Edit the schedule or skip anything you do not want.
                        Nothing is added until you confirm.
                    </p>
                </div>
                <strong>
                    {selectedCount} of {tasks.length} selected
                </strong>
            </header>
            {result.sourceTitle ? (
                <p className={styles.source}>Based on {result.sourceTitle}</p>
            ) : null}
            <form onSubmit={submit}>
                <ol className={styles.tasks}>
                    {tasks.map((task, index) => (
                        <li
                            className={!task.selected ? styles.skipped : ""}
                            key={task.id}
                        >
                            <label className={styles.include}>
                                <input
                                    checked={task.selected}
                                    disabled={saving}
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "selected",
                                            event.target.checked
                                        )
                                    }
                                    type="checkbox"
                                />
                                Include task {index + 1}
                            </label>
                            <div className={styles.fields}>
                                <Input
                                    disabled={!task.selected || saving}
                                    label={`Task ${index + 1} title`}
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "title",
                                            event.target.value
                                        )
                                    }
                                    required={task.selected}
                                    value={task.title}
                                />
                                <Input
                                    disabled={!task.selected || saving}
                                    label={`Task ${index + 1} subject`}
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "subject",
                                            event.target.value
                                        )
                                    }
                                    required={task.selected}
                                    value={task.subject}
                                />
                                <Input
                                    disabled={!task.selected || saving}
                                    label={`Task ${index + 1} due date`}
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "dueDate",
                                            event.target.value
                                        )
                                    }
                                    required={task.selected}
                                    type="date"
                                    value={task.dueDate}
                                />
                                <Input
                                    disabled={!task.selected || saving}
                                    label={`Task ${index + 1} duration`}
                                    max="480"
                                    min="5"
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "estimatedMinutes",
                                            event.target.value
                                        )
                                    }
                                    required={task.selected}
                                    type="number"
                                    value={task.estimatedMinutes}
                                />
                                <Select
                                    disabled={!task.selected || saving}
                                    label={`Task ${index + 1} priority`}
                                    onChange={(event) =>
                                        updateTask(
                                            task.id,
                                            "priority",
                                            event.target.value
                                        )
                                    }
                                    value={task.priority}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </Select>
                            </div>
                            <Textarea
                                disabled={!task.selected || saving}
                                label={`Task ${index + 1} notes`}
                                maxLength="500"
                                onChange={(event) =>
                                    updateTask(
                                        task.id,
                                        "notes",
                                        event.target.value
                                    )
                                }
                                rows="2"
                                value={task.notes}
                            />
                        </li>
                    ))}
                </ol>
                {validationError || saveError ? (
                    <p className={styles.error} role="alert">
                        {validationError || saveError.message}
                    </p>
                ) : null}
                <div className={styles.actions}>
                    <Button
                        disabled={saving}
                        onClick={onBack}
                        type="button"
                        variant="outline"
                    >
                        Back to response
                    </Button>
                    <Button
                        disabled={!selectedCount}
                        loading={saving}
                        loadingLabel="Adding tasks"
                        type="submit"
                    >
                        Add {selectedCount}{" "}
                        {selectedCount === 1 ? "task" : "tasks"} to Study
                        Planner
                    </Button>
                </div>
            </form>
        </section>
    );
}
