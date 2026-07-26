import Avatar from "../../ui/Avatar/index.js";
import Badge from "../../ui/Badge/index.js";
import Button from "../../ui/Button/index.js";
import CommunityBanner from "../CommunityBanner/index.js";
import styles from "./CommunityHeader.module.css";

export default function CommunityHeader({ action, community, onShare }) {
    return (
        <header className={styles.header}>
            <CommunityBanner
                alt={community.banner ? `${community.name} banner` : ""}
                category={community.category}
                src={community.banner}
            />
            <div className={styles.content}>
                <Avatar
                    className={styles.avatar}
                    name={community.name}
                    size="xlarge"
                    src={community.avatar}
                />
                <div className={styles.summary}>
                    <div className={styles.titleRow}>
                        <h2>{community.name}</h2>
                        <Badge variant="neutral">{community.visibility}</Badge>
                    </div>
                    <p>{community.description || "A StudentHub community."}</p>
                    <div className={styles.metadata}>
                        <span>
                            {community.memberCount.toLocaleString()} members
                        </span>
                        <span>Category: {community.category}</span>
                    </div>
                </div>
                <div className={styles.actions}>
                    {action}
                    <Button onClick={onShare} variant="ghost">
                        Share
                    </Button>
                </div>
            </div>
        </header>
    );
}
