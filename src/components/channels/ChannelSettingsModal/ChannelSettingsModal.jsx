import { useState } from "react";

import Button from "../../ui/Button/index.js";
import Input from "../../ui/Input/index.js";
import Modal from "../../ui/Modal/index.js";
import Select from "../../ui/Select/index.js";
import Textarea from "../../ui/Textarea/index.js";
import { CHANNEL_TYPES } from "../../../config/channel-types.js";
import {
    normalizeChannelName,
    validateChannelInput
} from "../../../models/channel.js";
import styles from "./ChannelSettingsModal.module.css";

export default function ChannelSettingsModal({
    channel,
    onClose,
    onDelete,
    onUpdate,
    open
}) {
    const [form, setForm] = useState({
        name: channel?.name || "",
        description: channel?.description || "",
        type: channel?.type || CHANNEL_TYPES.TEXT
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!channel) return null;

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setError("");
    }

    async function handleSave(event) {
        event.preventDefault();
        setSubmitting(true);

        try {
            const validated = validateChannelInput(form);
            await onUpdate(channel.id, validated);
            onClose();
        } catch (nextError) {
            setError(nextError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (
            !window.confirm(`Delete #${channel.name}? This cannot be undone.`)
        ) {
            return;
        }

        setSubmitting(true);

        try {
            await onDelete(channel.id);
            onClose();
        } catch (nextError) {
            setError(nextError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            description={`Manage #${channel.name}.`}
            footer={
                <>
                    {channel.id !== "general" ? (
                        <Button
                            disabled={submitting}
                            onClick={handleDelete}
                            variant="danger"
                        >
                            Delete channel
                        </Button>
                    ) : null}
                    <span className={styles.spacer} />
                    <Button
                        disabled={submitting}
                        onClick={onClose}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={submitting}
                        loadingLabel="Saving"
                        onClick={handleSave}
                    >
                        Save changes
                    </Button>
                </>
            }
            onClose={onClose}
            open={open}
            size="wide"
            title="Channel settings"
        >
            <form className={styles.form} noValidate onSubmit={handleSave}>
                <Input
                    disabled={channel.id === "general"}
                    helperText={
                        channel.id === "general"
                            ? "#general is a permanent community channel."
                            : "Use lowercase letters, numbers, and hyphens."
                    }
                    label="Channel name"
                    maxLength={80}
                    name="name"
                    onBlur={(event) =>
                        setForm((current) => ({
                            ...current,
                            name: normalizeChannelName(event.target.value)
                        }))
                    }
                    onChange={updateField}
                    required
                    value={form.name}
                />
                <Textarea
                    helperText={`${form.description.length}/120`}
                    label="Description"
                    maxLength={120}
                    name="description"
                    onChange={updateField}
                    value={form.description}
                />
                <Select
                    label="Channel type"
                    name="type"
                    onChange={updateField}
                    value={form.type}
                >
                    <option value={CHANNEL_TYPES.TEXT}>Text</option>
                    <option value={CHANNEL_TYPES.ANNOUNCEMENTS}>
                        Announcements
                    </option>
                </Select>
                {error ? (
                    <p className={styles.formError} role="alert">
                        {error}
                    </p>
                ) : null}
            </form>
        </Modal>
    );
}
