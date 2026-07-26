import { useCallback, useEffect, useRef, useState } from "react";

import { useNetwork } from "../../hooks/useNetwork.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./NetworkStatus.module.css";

const CHANGE_DELAY = 450;
const RECOVERY_DURATION = 3500;

export default function NetworkStatus() {
    const { isOnline } = useNetwork();
    const { showToast } = useToast();
    const confirmedOffline = useRef(!isOnline);
    const previousOnline = useRef(isOnline);
    const changeTimer = useRef(null);
    const recoveryTimer = useRef(null);
    const [visibleStatus, setVisibleStatus] = useState(
        isOnline ? null : "offline"
    );

    const dismiss = useCallback(() => setVisibleStatus(null), []);

    useEffect(() => {
        if (previousOnline.current === isOnline) return undefined;
        previousOnline.current = isOnline;

        window.clearTimeout(changeTimer.current);
        window.clearTimeout(recoveryTimer.current);

        changeTimer.current = window.setTimeout(() => {
            if (!isOnline) {
                confirmedOffline.current = true;
                setVisibleStatus("offline");
                return;
            }

            if (!confirmedOffline.current) {
                setVisibleStatus(null);
                return;
            }

            confirmedOffline.current = false;
            setVisibleStatus("online");
            showToast({
                title: "Connection restored",
                message: "You're back online.",
                type: "success"
            });
            recoveryTimer.current = window.setTimeout(
                () => setVisibleStatus(null),
                RECOVERY_DURATION
            );
        }, CHANGE_DELAY);

        return () => {
            window.clearTimeout(changeTimer.current);
            window.clearTimeout(recoveryTimer.current);
        };
    }, [isOnline, showToast]);

    if (!visibleStatus) return null;

    const offline = visibleStatus === "offline";

    return (
        <aside
            aria-atomic="true"
            aria-live={offline ? "assertive" : "polite"}
            className={styles.banner}
            data-status={visibleStatus}
            role={offline ? "alert" : "status"}
        >
            <span aria-hidden="true" className={styles.icon}>
                {offline ? "!" : "✓"}
            </span>
            <div className={styles.copy}>
                <strong>
                    {offline ? "You're offline" : "You're back online"}
                </strong>
                <p>
                    {offline
                        ? "Some StudentHub features may not work."
                        : "StudentHub features are available again."}
                </p>
            </div>
            <button
                aria-label={`Dismiss ${offline ? "offline" : "online"} notification`}
                onClick={dismiss}
                type="button"
            >
                Dismiss
            </button>
        </aside>
    );
}
