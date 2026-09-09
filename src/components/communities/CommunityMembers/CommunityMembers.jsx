import Avatar from "../../ui/Avatar/index.js";
import Badge from "../../ui/Badge/index.js";
import Divider from "../../ui/Divider/index.js";
import { COMMUNITY_ROLES } from "../../../config/community-roles.js";
import { getCommunityBadgeLabel } from "../../../models/community-reputation.js";
import styles from "./CommunityMembers.module.css";

const ROLE_ORDER = [
    COMMUNITY_ROLES.OWNER,
    COMMUNITY_ROLES.ADMIN,
    COMMUNITY_ROLES.MODERATOR,
    COMMUNITY_ROLES.MEMBER
];

export default function CommunityMembers({ members = [] }) {
    return (
        <section aria-labelledby="community-members-heading">
            <div className={styles.heading}>
                <h3 id="community-members-heading">Members</h3>
                <span>{members.length}</span>
            </div>
            <Divider />
            <div className={styles.list}>
                {ROLE_ORDER.flatMap((role) =>
                    members
                        .filter((member) => member.role === role)
                        .map((member) => (
                            <div className={styles.member} key={member.userId}>
                                <Avatar
                                    name={
                                        member.displayName ||
                                        member.nickname ||
                                        "Student"
                                    }
                                    size="small"
                                    src={member.photoURL}
                                />
                                <div>
                                    <strong>
                                        {member.displayName ||
                                            member.nickname ||
                                            "Student"}
                                    </strong>
                                    <span>
                                        {member.nickname
                                            ? `@${member.nickname} · `
                                            : ""}
                                        {member.reputationPoints || 0} pts ·{" "}
                                        {member.reputationLevel || "Newcomer"} ·{" "}
                                        {member.trustLevel ||
                                            "Community Member"}
                                    </span>
                                    {member.reputationBadges?.length ? (
                                        <span>
                                            Badges:{" "}
                                            {member.reputationBadges
                                                .map(getCommunityBadgeLabel)
                                                .filter(Boolean)
                                                .join(", ")}
                                        </span>
                                    ) : null}
                                </div>
                                <Badge
                                    variant={
                                        role === COMMUNITY_ROLES.OWNER
                                            ? "primary"
                                            : "neutral"
                                    }
                                >
                                    {role}
                                </Badge>
                            </div>
                        ))
                )}
            </div>
        </section>
    );
}
