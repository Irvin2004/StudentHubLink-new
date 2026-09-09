import { useEffect, useState } from "react";

import { COMMUNITY_ROLES } from "../../../config/community-roles.js";
import {
    hasTrustCapability,
    TRUST_CAPABILITIES
} from "../../../models/community-reputation.js";
import {
    createCommunityTopicTag,
    subscribeCommunityCurationFlags,
    subscribeCommunityTopicTags
} from "../../../services/community-trust-service.js";
import { subscribeCommunityReputation } from "../../../services/community-reputation-service.js";
import Button from "../../../components/ui/Button/Button.jsx";
import Input from "../../../components/ui/Input/Input.jsx";
import styles from "./CommunityTrustPanel.module.css";

const CAPABILITY_LABELS = Object.freeze({
    [TRUST_CAPABILITIES.CREATE_TOPIC_TAGS]: "Create community topic tags",
    [TRUST_CAPABILITIES.FLAG_DUPLICATE_QUESTIONS]:
        "Flag possible duplicate questions",
    [TRUST_CAPABILITIES.ACCESS_CURATION_TOOLS]:
        "View the community curation queue"
});

export default function CommunityTrustPanel({
    actor,
    communityId,
    onReputationChange,
    onTopicTagsChange,
    role
}) {
    const [reputation, setReputation] = useState(null);
    const [tags, setTags] = useState([]);
    const [flags, setFlags] = useState([]);
    const [tag, setTag] = useState("");
    const [message, setMessage] = useState("");
    const isManager = [
        COMMUNITY_ROLES.OWNER,
        COMMUNITY_ROLES.ADMIN,
        COMMUNITY_ROLES.MODERATOR
    ].includes(role);
    const canCreateTags =
        isManager ||
        hasTrustCapability(reputation, TRUST_CAPABILITIES.CREATE_TOPIC_TAGS);
    const canViewCuration =
        isManager ||
        hasTrustCapability(
            reputation,
            TRUST_CAPABILITIES.ACCESS_CURATION_TOOLS
        );

    useEffect(
        () =>
            subscribeCommunityReputation(
                communityId,
                actor.id,
                (next) => {
                    setReputation(next);
                    onReputationChange?.(next);
                },
                () => setReputation(null)
            ),
        [actor.id, communityId, onReputationChange]
    );

    useEffect(
        () =>
            subscribeCommunityTopicTags(
                communityId,
                (next) => {
                    setTags(next);
                    onTopicTagsChange?.(next);
                },
                () => setTags([])
            ),
        [communityId, onTopicTagsChange]
    );

    useEffect(() => {
        if (!canViewCuration) return undefined;
        return subscribeCommunityCurationFlags(communityId, setFlags, () =>
            setFlags([])
        );
    }, [canViewCuration, communityId]);

    if (!reputation) return null;

    return (
        <section aria-labelledby="trust-heading" className={styles.panel}>
            <header className={styles.heading}>
                <div>
                    <p>Badges + trust</p>
                    <h3 id="trust-heading">{reputation.trustLevel}</h3>
                </div>
                <span>{reputation.level} reputation level</span>
            </header>
            <p className={styles.authorityNote}>
                Trust unlocks contribution tools. Community moderators and
                admins always retain final authority.
            </p>
            <div className={styles.badges}>
                {reputation.badgeProgress.map((badge) => (
                    <article
                        className={styles.badge}
                        data-earned={badge.earned || undefined}
                        key={badge.id}
                    >
                        <div>
                            <strong>
                                {badge.earned ? "✓ " : ""}
                                {badge.label}
                            </strong>
                            <span>
                                {badge.current}/{badge.target}
                            </span>
                        </div>
                        <p>{badge.description}</p>
                        <progress
                            aria-label={`${badge.label} progress`}
                            max={badge.target}
                            value={badge.current}
                        />
                    </article>
                ))}
            </div>
            <div className={styles.capabilities}>
                <h4>Unlocked trust tools</h4>
                {reputation.capabilities.length ? (
                    <ul>
                        {reputation.capabilities.map((capability) => (
                            <li key={capability}>
                                {CAPABILITY_LABELS[capability]}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>
                        Keep making useful contributions to unlock trust tools.
                    </p>
                )}
            </div>
            {canCreateTags ? (
                <div className={styles.tagTools}>
                    <form
                        onSubmit={async (event) => {
                            event.preventDefault();
                            try {
                                const created = await createCommunityTopicTag(
                                    communityId,
                                    actor,
                                    tag
                                );
                                setMessage(
                                    created
                                        ? "Topic tag created."
                                        : "That topic tag already exists."
                                );
                                if (created) setTag("");
                            } catch (error) {
                                setMessage(error.message);
                            }
                        }}
                    >
                        <Input
                            label="Create a community topic tag"
                            maxLength="30"
                            onChange={(event) => setTag(event.target.value)}
                            placeholder="e.g. organic chemistry"
                            required
                            value={tag}
                        />
                        <Button size="small" type="submit">
                            Add tag
                        </Button>
                    </form>
                    {message ? <small role="status">{message}</small> : null}
                </div>
            ) : null}
            {tags.length ? (
                <div className={styles.tags} aria-label="Community topic tags">
                    {tags.map((item) => (
                        <span key={item.id}>{item.label}</span>
                    ))}
                </div>
            ) : null}
            {canViewCuration ? (
                <div className={styles.curation}>
                    <h4>Community curation queue</h4>
                    {flags.length ? (
                        <ul>
                            {flags.map((flag) => (
                                <li key={flag.id}>
                                    <strong>Possible duplicate:</strong>{" "}
                                    {flag.questionTitle}
                                    <span>Flagged by {flag.createdByName}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No questions currently need curation review.</p>
                    )}
                </div>
            ) : null}
        </section>
    );
}
