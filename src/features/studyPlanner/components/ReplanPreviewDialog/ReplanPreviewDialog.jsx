import { useState } from "react";

import Button from "../../../../components/ui/Button/index.js";
import Input from "../../../../components/ui/Input/index.js";
import Modal from "../../../../components/ui/Modal/index.js";
import Select from "../../../../components/ui/Select/index.js";
import styles from "./ReplanPreviewDialog.module.css";

const CHANGE_LABELS = Object.freeze({
    add: "Add block",
    delete: "Remove block",
    split: "Split block",
    update: "Update block"
});

function blockSummary(block) {
    if (!block) return "";
    return `${block.dueDate} · ${block.estimatedMinutes} min · ${block.subject}`;
}

export default function ReplanPreviewDialog({ onClose, onSave, open, replan }) {
    const [changes, setChanges] = useState(() => replan?.changes || []);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const selected = changes.filter((change) => change.selected);

    function toggle(changeId) {
        setChanges((current) =>
            current.map((change) =>
                change.id === changeId
                    ? { ...change, selected: !change.selected }
                    : change
            )
        );
    }

    function updateAfter(changeId, field, value) {
        setChanges((current) =>
            current.map((change) =>
                change.id === changeId
                    ? { ...change, after: { ...change.after, [field]: value } }
                    : change
            )
        );
    }

    async function saveChanges() {
        setError("");
        setSaving(true);
        try {
            await onSave(selected);
        } catch (nextError) {
            setError(
                nextError?.message || "The revised plan could not be saved."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            description="Review every proposed change. Your current plan stays unchanged until you approve."
            onClose={saving ? undefined : onClose}
            open={open}
            size="wide"
            title="Re-plan my week"
        >
            <div className={styles.content}>
                {changes.length ? (
                    <div className={styles.changes}>
                        {changes.map((change) => {
                            const editable =
                                change.kind === "add" ||
                                change.kind === "update";
                            return (
                                <article
                                    className={`${styles.change} ${
                                        change.selected ? "" : styles.skipped
                                    }`}
                                    key={change.id}
                                >
                                    <header>
                                        <div>
                                            <span>
                                                {CHANGE_LABELS[change.kind]}
                                            </span>
                                            <h3>
                                                {change.after?.title ||
                                                    change.before?.title}
                                            </h3>
                                        </div>
                                        <div className={styles.actions}>
                                            {editable ? (
                                                <Button
                                                    onClick={() =>
                                                        setEditingId(
                                                            editingId ===
                                                                change.id
                                                                ? null
                                                                : change.id
                                                        )
                                                    }
                                                    size="small"
                                                    variant="secondary"
                                                >
                                                    {editingId === change.id
                                                        ? "Done"
                                                        : "Edit"}
                                                </Button>
                                            ) : null}
                                            <Button
                                                aria-pressed={!change.selected}
                                                onClick={() =>
                                                    toggle(change.id)
                                                }
                                                size="small"
                                                variant="outline"
                                            >
                                                {change.selected
                                                    ? "Skip change"
                                                    : "Include change"}
                                            </Button>
                                        </div>
                                    </header>

                                    {editingId === change.id ? (
                                        <div className={styles.editor}>
                                            <Input
                                                label="Task"
                                                onChange={(event) =>
                                                    updateAfter(
                                                        change.id,
                                                        "title",
                                                        event.target.value
                                                    )
                                                }
                                                value={change.after.title}
                                            />
                                            <Input
                                                label="Subject"
                                                onChange={(event) =>
                                                    updateAfter(
                                                        change.id,
                                                        "subject",
                                                        event.target.value
                                                    )
                                                }
                                                value={change.after.subject}
                                            />
                                            <Input
                                                label="Date"
                                                onChange={(event) =>
                                                    updateAfter(
                                                        change.id,
                                                        "dueDate",
                                                        event.target.value
                                                    )
                                                }
                                                type="date"
                                                value={change.after.dueDate}
                                            />
                                            <Input
                                                label="Duration (minutes)"
                                                min="15"
                                                onChange={(event) =>
                                                    updateAfter(
                                                        change.id,
                                                        "estimatedMinutes",
                                                        Number(
                                                            event.target.value
                                                        )
                                                    )
                                                }
                                                step="5"
                                                type="number"
                                                value={
                                                    change.after
                                                        .estimatedMinutes
                                                }
                                            />
                                            <Select
                                                label="Priority"
                                                onChange={(event) =>
                                                    updateAfter(
                                                        change.id,
                                                        "priority",
                                                        event.target.value
                                                    )
                                                }
                                                value={change.after.priority}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">
                                                    Medium
                                                </option>
                                                <option value="High">
                                                    High
                                                </option>
                                            </Select>
                                        </div>
                                    ) : null}

                                    {change.kind === "split" ? (
                                        <div className={styles.split}>
                                            {change.after.map((block) => (
                                                <span key={block.title}>
                                                    {block.title}:{" "}
                                                    {blockSummary(block)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.comparison}>
                                            {change.before ? (
                                                <span>
                                                    Current:{" "}
                                                    {blockSummary(
                                                        change.before
                                                    )}
                                                </span>
                                            ) : null}
                                            {change.after ? (
                                                <span>
                                                    Proposed:{" "}
                                                    {blockSummary(change.after)}
                                                </span>
                                            ) : null}
                                        </div>
                                    )}
                                    <p>{change.reason}</p>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className={styles.empty}>
                        Your current week already matches Thuto’s latest plan.
                    </p>
                )}

                {error ? (
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                ) : null}
                <footer className={styles.footer}>
                    <Button
                        disabled={saving}
                        onClick={onClose}
                        variant="secondary"
                    >
                        Keep current plan
                    </Button>
                    <Button
                        disabled={!selected.length}
                        loading={saving}
                        loadingLabel="Applying changes"
                        onClick={saveChanges}
                    >
                        Approve selected changes
                    </Button>
                </footer>
            </div>
        </Modal>
    );
}
