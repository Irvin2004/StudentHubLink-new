import { useEffect, useState } from "react";

import {
    subscribeCommunityLeaderboard,
    subscribeCommunityReputation
} from "../../../services/community-reputation-service.js";
import styles from "./CommunityLeaderboard.module.css";

export default function CommunityLeaderboard({ communityId, currentUserId }) {
    const [leaders, setLeaders] = useState([]);
    const [current, setCurrent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!communityId) return undefined;
        return subscribeCommunityLeaderboard(
            communityId,
            (items) => {
                setLeaders(items);
                setLoading(false);
            },
            () => setLoading(false)
        );
    }, [communityId]);

    useEffect(() => {
        if (!communityId || !currentUserId) return undefined;
        return subscribeCommunityReputation(
            communityId,
            currentUserId,
            setCurrent,
            () => setCurrent(null)
        );
    }, [communityId, currentUserId]);

    const currentIsRanked = leaders.some(
        (leader) => leader.userId === currentUserId
    );

    return (
        <section
            aria-labelledby="community-reputation-heading"
            className={styles.panel}
        >
            <div className={styles.heading}>
                <div>
                    <p>Community reputation</p>
                    <h3 id="community-reputation-heading">Top contributors</h3>
                </div>
                {current ? (
                    <span className={styles.currentScore}>
                        You: {current.points} pts · {current.level} ·{" "}
                        {current.trustLevel}
                    </span>
                ) : null}
            </div>
            {loading ? (
                <p className={styles.state}>Loading leaderboard…</p>
            ) : leaders.length ? (
                <ol className={styles.list}>
                    {leaders.map((leader, index) => (
                        <li key={leader.userId}>
                            <span className={styles.rank}>{index + 1}</span>
                            <strong>
                                {leader.displayName}
                                {leader.userId === currentUserId
                                    ? " (you)"
                                    : ""}
                            </strong>
                            <span>
                                {leader.level} · {leader.trustLevel}
                            </span>
                            <b>{leader.points} pts</b>
                        </li>
                    ))}
                    {!currentIsRanked && current?.points ? (
                        <li className={styles.currentRow}>
                            <span className={styles.rank}>—</span>
                            <strong>You</strong>
                            <span>{current.level}</span>
                            <b>{current.points} pts</b>
                        </li>
                    ) : null}
                </ol>
            ) : (
                <p className={styles.state}>
                    Helpful contributions will appear here.
                </p>
            )}
        </section>
    );
}
