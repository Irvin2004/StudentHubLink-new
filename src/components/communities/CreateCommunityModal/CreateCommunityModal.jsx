import { useRef, useState } from "react";

import Button from "../../ui/Button/index.js";
import Input from "../../ui/Input/index.js";
import Modal from "../../ui/Modal/index.js";
import Select from "../../ui/Select/index.js";
import Textarea from "../../ui/Textarea/index.js";
import { COMMUNITY_VISIBILITY } from "../../../models/community.js";
import { COMMUNITY_CATEGORIES } from "../../../utils/community-validation.js";
import styles from "./CreateCommunityModal.module.css";

const INITIAL_FORM = {
    name: "",
    description: "",
    category: "",
    visibility: COMMUNITY_VISIBILITY.PUBLIC,
    avatar: "",
    banner: ""
};

export default function CreateCommunityModal({ onClose, onCreate, open }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const nameRef = useRef(null);

    function handleClose() {
        setForm(INITIAL_FORM);
        setErrors({});
        setSubmitting(false);
        onClose();
    }

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const nextErrors = {};

        if (form.name.trim().length < 3) {
            nextErrors.name = "Community name must be at least 3 characters.";
        }

        if (!form.category) {
            nextErrors.category = "Choose a community category.";
        }

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            nameRef.current?.focus();
            return;
        }

        setSubmitting(true);

        try {
            await onCreate({
                ...form,
                avatar: form.avatar || null,
                banner: form.banner || null
            });
            handleClose();
        } catch (error) {
            setErrors({ form: error.message });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            description="Bring students together around a shared interest."
            footer={
                <>
                    <Button
                        disabled={submitting}
                        onClick={handleClose}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        loading={submitting}
                        loadingLabel="Creating"
                        onClick={handleSubmit}
                    >
                        Create community
                    </Button>
                </>
            }
            onClose={handleClose}
            open={open}
            size="wide"
            title="Create community"
        >
            <form
                className={styles.form}
                id="create-community-form"
                noValidate
                onSubmit={handleSubmit}
            >
                <Input
                    error={errors.name}
                    label="Community name"
                    maxLength={80}
                    name="name"
                    onChange={updateField}
                    ref={nameRef}
                    required
                    value={form.name}
                />
                <Textarea
                    helperText={`${form.description.length} / 1000`}
                    label="Description"
                    maxLength={1000}
                    name="description"
                    onChange={updateField}
                    value={form.description}
                />
                <div className={styles.row}>
                    <Select
                        error={errors.category}
                        label="Category"
                        name="category"
                        onChange={updateField}
                        required
                        value={form.category}
                    >
                        <option value="">Select a category</option>
                        {COMMUNITY_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category.charAt(0).toUpperCase() +
                                    category.slice(1)}
                            </option>
                        ))}
                    </Select>
                    <Select
                        label="Visibility"
                        name="visibility"
                        onChange={updateField}
                        value={form.visibility}
                    >
                        <option value={COMMUNITY_VISIBILITY.PUBLIC}>
                            Public
                        </option>
                        <option value={COMMUNITY_VISIBILITY.PRIVATE}>
                            Private
                        </option>
                        <option value={COMMUNITY_VISIBILITY.UNLISTED}>
                            Unlisted
                        </option>
                    </Select>
                </div>
                <Input
                    label="Avatar URL (optional)"
                    name="avatar"
                    onChange={updateField}
                    placeholder="https://example.com/avatar.png"
                    type="url"
                    value={form.avatar}
                />
                <Input
                    label="Banner URL (optional)"
                    name="banner"
                    onChange={updateField}
                    placeholder="https://example.com/banner.jpg"
                    type="url"
                    value={form.banner}
                />
                {errors.form ? (
                    <p className={styles.formError} role="alert">
                        {errors.form}
                    </p>
                ) : null}
            </form>
        </Modal>
    );
}
