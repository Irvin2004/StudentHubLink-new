import { useEffect } from "react";

import ActivityFeed from "../../notifications/ActivityFeed/ActivityFeed.jsx";
import { useActivityFeed } from "../../../hooks/useActivityFeed.js";
import { useObservability } from "../../../hooks/useObservability.js";
import { useToast } from "../../../hooks/useToast.js";
import styles from "./ChatActivityView.module.css";

export default function ChatActivityView({ communityId }) {
    const { showToast } = useToast();
    const { captureError, getActionableErrorMessage } = useObservability();
    const { activities, error, loading } = useActivityFeed(communityId);

    useEffect(() => {
        if (!error) return;
        captureError(error, { feature: "community_activity" });
        showToast({
            title: "Activity unavailable",
            message: getActionableErrorMessage(error, "notifications"),
            type: "error"
        });
    }, [captureError, error, getActionableErrorMessage, showToast]);

    return (
        <div className={styles.activity}>
            <ActivityFeed
                activities={activities}
                error={error}
                loading={loading}
            />
        </div>
    );
}
