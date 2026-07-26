import { useEffect, useMemo, useState } from "react";

import { NetworkContext } from "./network-context.js";

function getInitialNetworkState() {
    return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function NetworkProvider({ children }) {
    const [isOnline, setIsOnline] = useState(getInitialNetworkState);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const value = useMemo(() => ({ isOnline }), [isOnline]);

    return (
        <NetworkContext.Provider value={value}>
            {children}
        </NetworkContext.Provider>
    );
}
