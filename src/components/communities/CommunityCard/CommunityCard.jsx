import Avatar from "../../ui/Avatar/index.js";
import Badge from "../../ui/Badge/index.js";
import Card from "../../ui/Card/index.js";
import CommunityBanner from "../CommunityBanner/index.js";
import styles from "./CommunityCard.module.css";

const VISIBILITY_VARIANTS = {
    public: "success",
    private: "neutral",
    unlisted: "warning"
};

export default function CommunityCard({ action, community, onOpenCommunity }) {
    const memberLabel = `${community.memberCount.toLocaleString()} ${
        community.memberCount === 1 ? "member" : "members"
    }`;

    function openCommunity() {
        onOpenCommunity?.(community);
    }

    return (
        <Card
            aria-label={`${community.name}, ${memberLabel}`}
            as="article"
            className={styles.card}
            onKeyDown={(event) => {
                if (
                    (event.key === "Enter" || event.key === " ") &&
                    event.target === event.currentTarget
                ) {
                    event.preventDefault();
                    openCommunity();
                }
            }}
            padding="none"
            tabIndex={0}
        >
            <CommunityBanner
                alt={community.banner ? `${community.name} banner` : ""}
                category={community.category}
                src={community.banner}
            />
            <div className={styles.body}>
                <div className={styles.metaRow}>
                    <Avatar
                        className={styles.avatar}
                        name={community.name}
                        size="large"
                        src={community.avatar}
                    />
                    <Badge
                        variant={
                            VISIBILITY_VARIANTS[community.visibility] ||
                            "neutral"
                        }
                    >
                        {community.visibility}
                    </Badge>
                </div>
                <button
                    className={styles.titleButton}
                    onClick={openCommunity}
                    type="button"
                >
                    <h2>{community.name}</h2>
                </button>
                <p className={styles.members}>{memberLabel}</p>
                <p className={styles.description}>
                    {community.description || "A StudentHub community."}
                </p>
                <div className={styles.footer}>{action}</div>
            </div>
        </Card>
    );
}
