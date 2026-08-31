import { useRef, useState } from "react";

import { COMMUNITY_ROLES } from "../../../config/community-roles.js";
import {
    canChangeCommunityMemberRole,
    canDeleteCommunity,
    canEditCommunity,
    canRemoveCommunityMember
} from "../../../config/community-permissions.js";
import { COMMUNITY_VISIBILITY } from "../../../models/community.js";
import { getCommunityBadgeLabel } from "../../../models/community-reputation.js";
import { COMMUNITY_CATEGORIES } from "../../../utils/community-validation.js";
import Avatar from "../../ui/Avatar/index.js";
import Badge from "../../ui/Badge/index.js";
import Button from "../../ui/Button/index.js";
import Input from "../../ui/Input/index.js";
import Modal from "../../ui/Modal/index.js";
import Select from "../../ui/Select/index.js";
import Textarea from "../../ui/Textarea/index.js";
import styles from "./CommunitySettingsModal.module.css";

const ROLE_LABELS = Object.freeze({
    [COMMUNITY_ROLES.OWNER]: "Owner",
    [COMMUNITY_ROLES.ADMIN]: "Admin",
    [COMMUNITY_ROLES.MODERATOR]: "Moderator",
    [COMMUNITY_ROLES.MEMBER]: "Member"
});

function toForm(community) {
    return {
        name: community?.name || "",
        description: community?.description || "",
        category: community?.category || "other",
        visibility: community?.visibility || COMMUNITY_VISIBILITY.PUBLIC,
        avatar: community?.avatar || "",
        banner: community?.banner || ""
    };
}

export default function CommunitySettingsModal({
    community,
    currentUserId,
    error,
    hasMoreMembers,
    loading,
    loadingMoreMembers,
    members,
    onClose,
    onDelete,
    onLeave,
    onLoadMoreMembers,
    onRemoveMember,
    onRetry,
    onRoleChange,
    onSave,
    open,
    role
}) {
    const [form, setForm] = useState(() => toForm(community));
    const [actionError, setActionError] = useState("");
    const [pending, setPending] = useState("");
    const nameRef = useRef(null);
    const editable = canEditCommunity(role);
    const deletable = canDeleteCommunity(role);

    function handleClose() {
        setForm(toForm(community));
        setActionError("");
        setPending("");
        onClose();
    }

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setActionError("");
    }

    async function runAction(key, action) {
        setPending(key);
        setActionError("");

        try {
            await action();
        } catch (nextError) {
            setActionError(nextError.message);
        } finally {
            setPending("");
        }
    }

    function handleSave(event) {
        event.preventDefault();
        if (!editable) return;

        void runAction("save", () =>
            onSave({
                ...form,
                avatar: form.avatar || null,
                banner: form.banner || null
            })
        );
    }

    function handleRoleChange(member, nextRole) {
        if (!canChangeCommunityMemberRole(role, member.role, nextRole)) return;
        void runAction(`role-${member.userId}`, () =>
            onRoleChange(member, nextRole)
        );
    }

    function handleRemove(member) {
        if (!canRemoveCommunityMember(role, member.role)) return;
        if (
            !window.confirm(
                `Remove ${member.displayName} from ${community.name}?`
            )
        ) {
            return;
        }
        void runAction(`remove-${member.userId}`, () => onRemoveMember(member));
    }

    function handleLeave() {
        if (
            !window.confirm(
                `Leave ${community.name}? You can rejoin later if it is public.`
            )
        ) {
            return;
        }
        void runAction("leave", onLeave);
    }

    function handleDelete() {
        const confirmation = window.prompt(
            `Type ${community.name} to permanently delete this community.`
        );
        if (confirmation !== community.name) {
            if (confirmation !== null)
                setActionError("Community name did not match.");
            return;
        }
        void runAction("delete", onDelete);
    }

    const orderedMembers = [...members].sort((left, right) => {
        const order = ["owner", "admin", "moderator", "member"];
        return order.indexOf(left.role) - order.indexOf(right.role);
    });

    return (
        <Modal
            description="Update community details, permissions, and membership."
            initialFocusRef={editable ? nameRef : undefined}
            onClose={pending ? undefined : handleClose}
            open={open}
            size="wide"
            title="Community settings"
        >
            <div className={styles.content}>
                <section aria-labelledby="community-details-heading">
                    <div className={styles.sectionHeading}>
                        <div>
                            <h3 id="community-details-heading">
                                Community details
                            </h3>
                            <p>
                                {editable
                                    ? "Visible to students who can discover this community."
                                    : "Only owners and admins can edit these details."}
                            </p>
                        </div>
                        <Badge
                            variant={
                                role === COMMUNITY_ROLES.OWNER
                                    ? "primary"
                                    : "neutral"
                            }
                        >
                            {ROLE_LABELS[role] || "Member"}
                        </Badge>
                    </div>
                    <form
                        className={styles.form}
                        noValidate
                        onSubmit={handleSave}
                    >
                        <Input
                            disabled={!editable}
                            label="Community name"
                            maxLength={80}
                            name="name"
                            onChange={updateField}
                            ref={nameRef}
                            required
                            value={form.name}
                        />
                        <Textarea
                            disabled={!editable}
                            helperText={`${form.description.length} / 1000`}
                            label="Description"
                            maxLength={1000}
                            name="description"
                            onChange={updateField}
                            value={form.description}
                        />
                        <div className={styles.formRow}>
                            <Select
                                disabled={!editable}
                                label="Category"
                                name="category"
                                onChange={updateField}
                                value={form.category}
                            >
                                {COMMUNITY_CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                        {category.charAt(0).toUpperCase() +
                                            category.slice(1)}
                                    </option>
                                ))}
                            </Select>
                            <Select
                                disabled={!editable}
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
                        <div className={styles.formRow}>
                            <Input
                                disabled={!editable}
                                label="Avatar URL (optional)"
                                name="avatar"
                                onChange={updateField}
                                type="url"
                                value={form.avatar}
                            />
                            <Input
                                disabled={!editable}
                                label="Banner URL (optional)"
                                name="banner"
                                onChange={updateField}
                                type="url"
                                value={form.banner}
                            />
                        </div>
                        {editable ? (
                            <div className={styles.saveRow}>
                                <Button
                                    loading={pending === "save"}
                                    loadingLabel="Saving"
                                    type="submit"
                                >
                                    Save changes
                                </Button>
                            </div>
                        ) : null}
                    </form>
                </section>

                <section
                    aria-labelledby="manage-members-heading"
                    className={styles.membersSection}
                >
                    <div className={styles.sectionHeading}>
                        <div>
                            <h3 id="manage-members-heading">
                                Members ({members.length})
                            </h3>
                            <p>
                                Owners control admins. Admins can manage
                                moderators and members.
                            </p>
                        </div>
                    </div>
                    {loading ? (
                        <p aria-live="polite" className={styles.state}>
                            Loading members…
                        </p>
                    ) : error ? (
                        <div className={styles.state} role="alert">
                            <p>Members could not be loaded.</p>
                            <Button
                                onClick={onRetry}
                                size="small"
                                variant="outline"
                            >
                                Try again
                            </Button>
                        </div>
                    ) : !orderedMembers.length ? (
                        <p className={styles.state}>
                            No members have joined yet.
                        </p>
                    ) : (
                        <ul className={styles.memberList}>
                            {orderedMembers.map((member) => {
                                const isCurrentUser =
                                    member.userId === currentUserId;
                                const canChange =
                                    canChangeCommunityMemberRole(
                                        role,
                                        member.role,
                                        COMMUNITY_ROLES.MEMBER
                                    ) ||
                                    canChangeCommunityMemberRole(
                                        role,
                                        member.role,
                                        COMMUNITY_ROLES.ADMIN
                                    );
                                const memberPending = pending.endsWith(
                                    member.userId
                                );
                                return (
                                    <li
                                        className={styles.member}
                                        key={member.userId}
                                    >
                                        <Avatar
                                            name={member.displayName}
                                            size="small"
                                            src={member.photoURL}
                                        />
                                        <div className={styles.memberIdentity}>
                                            <strong>
                                                {member.displayName}
                                                {isCurrentUser ? " (you)" : ""}
                                            </strong>
                                            <span>
                                                {ROLE_LABELS[member.role]} ·{" "}
                                                {member.reputationPoints || 0}{" "}
                                                pts ·{" "}
                                                {member.reputationLevel ||
                                                    "Newcomer"}{" "}
                                                ·{" "}
                                                {member.trustLevel ||
                                                    "Community Member"}
                                            </span>
                                            {member.reputationBadges?.length ? (
                                                <span>
                                                    Badges:{" "}
                                                    {member.reputationBadges
                                                        .map(
                                                            getCommunityBadgeLabel
                                                        )
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </span>
                                            ) : null}
                                        </div>
                                        {canChange ? (
                                            <Select
                                                aria-label={`Role for ${member.displayName}`}
                                                disabled={memberPending}
                                                name={`role-${member.userId}`}
                                                onChange={(event) =>
                                                    handleRoleChange(
                                                        member,
                                                        event.target.value
                                                    )
                                                }
                                                value={member.role}
                                            >
                                                {role ===
                                                COMMUNITY_ROLES.OWNER ? (
                                                    <option
                                                        value={
                                                            COMMUNITY_ROLES.ADMIN
                                                        }
                                                    >
                                                        Admin
                                                    </option>
                                                ) : null}
                                                <option
                                                    value={
                                                        COMMUNITY_ROLES.MODERATOR
                                                    }
                                                >
                                                    Moderator
                                                </option>
                                                <option
                                                    value={
                                                        COMMUNITY_ROLES.MEMBER
                                                    }
                                                >
                                                    Member
                                                </option>
                                            </Select>
                                        ) : (
                                            <Badge
                                                variant={
                                                    member.role ===
                                                    COMMUNITY_ROLES.OWNER
                                                        ? "primary"
                                                        : "neutral"
                                                }
                                            >
                                                {ROLE_LABELS[member.role]}
                                            </Badge>
                                        )}
                                        {canRemoveCommunityMember(
                                            role,
                                            member.role
                                        ) && !isCurrentUser ? (
                                            <Button
                                                disabled={memberPending}
                                                onClick={() =>
                                                    handleRemove(member)
                                                }
                                                size="small"
                                                variant="danger"
                                            >
                                                Remove
                                            </Button>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {!loading && !error && hasMoreMembers ? (
                        <div className={styles.loadMore}>
                            <Button
                                loading={loadingMoreMembers}
                                loadingLabel="Loading members"
                                onClick={() => void onLoadMoreMembers()}
                                size="small"
                                variant="outline"
                            >
                                Load more members
                            </Button>
                        </div>
                    ) : null}
                </section>

                <section
                    aria-labelledby="community-access-heading"
                    className={styles.dangerZone}
                >
                    <div>
                        <h3 id="community-access-heading">Community access</h3>
                        <p>
                            {deletable
                                ? "Deleting removes the community, its channels, messages, files, and memberships."
                                : "Leave this community and remove it from your joined list."}
                        </p>
                    </div>
                    {deletable ? (
                        <Button
                            loading={pending === "delete"}
                            loadingLabel="Deleting"
                            onClick={handleDelete}
                            variant="danger"
                        >
                            Delete community
                        </Button>
                    ) : (
                        <Button
                            loading={pending === "leave"}
                            loadingLabel="Leaving"
                            onClick={handleLeave}
                            variant="danger"
                        >
                            Leave community
                        </Button>
                    )}
                </section>

                {actionError ? (
                    <p className={styles.formError} role="alert">
                        {actionError}
                    </p>
                ) : null}
            </div>
        </Modal>
    );
}
