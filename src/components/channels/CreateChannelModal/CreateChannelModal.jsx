import { useCallback, useEffect, useRef, useState } from "react";

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
import styles from "./CreateChannelModal.module.css";

const INITIAL_FORM = Object.freeze({
    name: "",
    description: "",
    type: CHANNEL_TYPES.TEXT
});

export default function CreateChannelModal({
    communityName,
    onClose,
    onCreate,
    open
}) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const nameRef = useRef(null);

    useEffect(() => {
        if (open) nameRef.current?.focus();
    }, [open]);

    const resetAndClose = useCallback(() => {
        setForm(INITIAL_FORM);
        setErrors({});
        setSubmitting(false);
        onClose();
    }, [onClose]);

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({
            ...current,
            [name]: undefined,
            form: undefined
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        let validated;

        try {
            validated = validateChannelInput(form);
        } catch (error) {
            setErrors({ name: error.message });
            nameRef.current?.focus();
            return;
        }

        setSubmitting(true);

        try {
            const channel = await onCreate(validated);
            resetAndClose();
            return channel;
        } catch (error) {
            setErrors({ form: error.message });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            description={`Add a space for focused discussion in ${communityName}.`}
            footer={
                <>
                    <Button
                        disabled={submitting}
                        onClick={resetAndClose}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        className={styles.primaryAction}
                        loading={submitting}
                        loadingLabel="Creating"
                        onClick={handleSubmit}
                    >
                        Create channel
                    </Button>
                </>
            }
            initialFocusRef={nameRef}
            onClose={resetAndClose}
            open={open}
            size="medium"
            title="Create channel"
        >
            <form className={styles.form} noValidate onSubmit={handleSubmit}>
                <div className={styles.nameField}>
                    <Input
                        error={errors.name}
                        helperText={
                            errors.name
                                ? undefined
                                : "Use lowercase letters, numbers, and hyphens."
                        }
                        icon={<span>#</span>}
                        label="Channel name"
                        maxLength={80}
                        name="name"
                        onBlur={(event) => {
                            const name = normalizeChannelName(
                                event.target.value
                            );
                            setForm((current) => ({ ...current, name }));
                        }}
                        onChange={updateField}
                        placeholder="e.g. study-group"
                        ref={nameRef}
                        required
                        value={form.name}
                    />
                </div>
                <Textarea
                    helperText={`${form.description.length}/120`}
                    label="Description"
                    maxLength={120}
                    name="description"
                    onChange={updateField}
                    placeholder="What is this channel for?"
                    value={form.description}
                />
                <Select
                    helperText={
                        form.type === CHANNEL_TYPES.ANNOUNCEMENTS
                            ? "Only owners and admins can post."
                            : "Everyone can post and reply."
                    }
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
                {errors.form ? (
                    <p className={styles.formError} role="alert">
                        {errors.form}
                    </p>
                ) : null}
            </form>
        </Modal>
    );
}
