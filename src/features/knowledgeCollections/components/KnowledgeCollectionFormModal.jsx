import { useMemo, useState } from "react";

import Button from "../../../components/ui/Button/index.js";
import Input from "../../../components/ui/Input/index.js";
import Modal from "../../../components/ui/Modal/index.js";
import Select from "../../../components/ui/Select/index.js";
import Textarea from "../../../components/ui/Textarea/index.js";
import { KNOWLEDGE_ITEM_TYPE_LABELS } from "../models/knowledge-collection.js";
import styles from "./KnowledgeCollectionFormModal.module.css";

export default function KnowledgeCollectionFormModal({
    candidates,
    initialCollection,
    onClose,
    onSave,
    open
}) {
    const [title, setTitle] = useState(initialCollection?.title || "");
    const [description, setDescription] = useState(
        initialCollection?.description || ""
    );
    const [tags, setTags] = useState(initialCollection?.tags?.join(", ") || "");
    const [items, setItems] = useState(initialCollection?.items || []);
    const [candidateId, setCandidateId] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const available = useMemo(
        () =>
            candidates.filter(
                (item) => !items.some((added) => added.id === item.id)
            ),
        [candidates, items]
    );
    const selectedCandidate = available.find(
        (item) => item.id === (candidateId || available[0]?.id)
    );

    function move(index, direction) {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        setItems((current) => {
            const next = [...current];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    return (
        <Modal
            description="Combine existing community knowledge into an ordered study path."
            onClose={saving ? undefined : onClose}
            open={open}
            size="wide"
            title={
                initialCollection
                    ? "Edit knowledge collection"
                    : "Create knowledge collection"
            }
        >
            <form
                className={styles.form}
                onSubmit={async (event) => {
                    event.preventDefault();
                    setSaving(true);
                    setError("");
                    try {
                        await onSave({
                            description,
                            items,
                            tags: tags.split(","),
                            title
                        });
                        onClose();
                    } catch (nextError) {
                        setError(nextError.message);
                    } finally {
                        setSaving(false);
                    }
                }}
            >
                <Input
                    label="Collection title"
                    maxLength="120"
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Calculus Exam Prep"
                    required
                    value={title}
                />
                <Textarea
                    label="Description"
                    maxLength="2000"
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    rows={4}
                    value={description}
                />
                <Input
                    helperText="Separate up to five subject or topic tags with commas."
                    label="Subject or topic tags"
                    onChange={(event) => setTags(event.target.value)}
                    required
                    value={tags}
                />
                <div className={styles.addItem}>
                    <Select
                        label="Existing study material"
                        onChange={(event) => setCandidateId(event.target.value)}
                        value={candidateId || available[0]?.id || ""}
                    >
                        {available.length ? (
                            available.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                    {
                                        KNOWLEDGE_ITEM_TYPE_LABELS[
                                            candidate.sourceType
                                        ]
                                    }{" "}
                                    · {candidate.title}
                                </option>
                            ))
                        ) : (
                            <option value="">
                                No more materials available
                            </option>
                        )}
                    </Select>
                    <Button
                        disabled={!selectedCandidate || items.length >= 20}
                        onClick={() => {
                            setItems((current) => [
                                ...current,
                                selectedCandidate
                            ]);
                            setCandidateId("");
                        }}
                        type="button"
                        variant="outline"
                    >
                        Add item
                    </Button>
                </div>
                <ol className={styles.items}>
                    {items.map((item, index) => (
                        <li key={item.id}>
                            <span>{index + 1}</span>
                            <div>
                                <strong>{item.title}</strong>
                                <small>
                                    {
                                        KNOWLEDGE_ITEM_TYPE_LABELS[
                                            item.sourceType
                                        ]
                                    }
                                </small>
                            </div>
                            <div className={styles.itemActions}>
                                <button
                                    aria-label={`Move ${item.title} up`}
                                    disabled={index === 0}
                                    onClick={() => move(index, -1)}
                                    type="button"
                                >
                                    ↑
                                </button>
                                <button
                                    aria-label={`Move ${item.title} down`}
                                    disabled={index === items.length - 1}
                                    onClick={() => move(index, 1)}
                                    type="button"
                                >
                                    ↓
                                </button>
                                <button
                                    aria-label={`Remove ${item.title}`}
                                    onClick={() =>
                                        setItems((current) =>
                                            current.filter(
                                                (candidate) =>
                                                    candidate.id !== item.id
                                            )
                                        )
                                    }
                                    type="button"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ol>
                {error ? <p role="alert">{error}</p> : null}
                <div className={styles.actions}>
                    <Button onClick={onClose} type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button loading={saving} type="submit">
                        {initialCollection
                            ? "Save changes"
                            : "Create collection"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
