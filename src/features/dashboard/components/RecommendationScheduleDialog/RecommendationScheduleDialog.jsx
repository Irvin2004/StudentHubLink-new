import { useState } from "react";

import Button from "../../../../components/ui/Button/index.js";
import Input from "../../../../components/ui/Input/index.js";
import Modal from "../../../../components/ui/Modal/index.js";
import Select from "../../../../components/ui/Select/index.js";
import Textarea from "../../../../components/ui/Textarea/index.js";
import styles from "./RecommendationScheduleDialog.module.css";

function linkedMaterialLabel(recommendation) {
    if (recommendation?.quizId) return "Quiz";
    if (recommendation?.flashcardDeckId) return "Flashcard deck";
    if (recommendation?.resourceId) return "Resource";
    return "Subject focus";
}

export default function RecommendationScheduleDialog({
    onClose,
    onSave,
    open,
    recommendation
}) {
    const studyPlan = recommendation?.studyPlan || {};
    const [form, setForm] = useState(studyPlan);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const update = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value
        }));
    };

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaving(true);
        try {
            await onSave({
                ...form,
                estimatedMinutes: Number(form.estimatedMinutes),
                flashcardDeckId: recommendation.flashcardDeckId,
                quizId: recommendation.quizId,
                resourceId: recommendation.resourceId,
                taskType: recommendation.taskType || form.taskType || "study"
            });
        } catch (nextError) {
            setError(
                nextError?.message || "The study task could not be saved."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            description="Review Thuto’s suggestion and adjust it before saving."
            onClose={saving ? undefined : onClose}
            open={open}
            size="small"
            title="Add to Study Plan"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.advisory}>
                    <strong>Why this time?</strong>
                    <p>{studyPlan.advisoryReason}</p>
                </div>

                <Input
                    label="Task title"
                    onChange={update("title")}
                    required
                    value={form.title || ""}
                />

                <div className={styles.row}>
                    <Input
                        label="Date"
                        onChange={update("dueDate")}
                        required
                        type="date"
                        value={form.dueDate || ""}
                    />
                    <Input
                        label="Duration (minutes)"
                        max="180"
                        min="10"
                        onChange={update("estimatedMinutes")}
                        required
                        step="5"
                        type="number"
                        value={form.estimatedMinutes || ""}
                    />
                </div>

                <div className={styles.row}>
                    <Select
                        label="Priority"
                        onChange={update("priority")}
                        required
                        value={form.priority || "Medium"}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </Select>
                    <Input
                        label="Subject"
                        onChange={update("subject")}
                        required
                        value={form.subject || ""}
                    />
                </div>

                <div className={styles.linked}>
                    <span>Linked {linkedMaterialLabel(recommendation)}</span>
                    <strong>{recommendation?.title}</strong>
                </div>

                <Textarea
                    label="Notes"
                    onChange={update("notes")}
                    rows={3}
                    value={form.notes || ""}
                />

                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}

                <div className={styles.actions}>
                    <Button
                        disabled={saving}
                        onClick={onClose}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={saving}
                        loadingLabel="Saving"
                        type="submit"
                    >
                        Add to Study Plan
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
