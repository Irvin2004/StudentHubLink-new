import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../hooks/useAuth.js";
import { getDashboard } from "../services/dashboard-service.js";

const EMPTY_DASHBOARD = {
    aiSuggestions: [],
    activity: [],
    continueLearning: [],
    deadlines: [],
    greeting: {
        message: "",
        name: ""
    },
    quickActions: [],
    stats: {
        assignments: 0,
        communities: 0,
        messages: 0,
        resources: 0
    }
};

export function useDashboard() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshIndex, setRefreshIndex] = useState(0);

    const reload = useCallback(() => {
        setRefreshIndex((current) => current + 1);
    }, []);

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError(null);

            try {
                const nextDashboard = await getDashboard(user?.uid);

                if (active) {
                    setDashboard(nextDashboard);
                }
            } catch (nextError) {
                if (active) {
                    setError(nextError);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadDashboard();

        return () => {
            active = false;
        };
    }, [refreshIndex, user?.uid]);

    return {
        dashboard,
        error,
        loading,
        reload
    };
}
