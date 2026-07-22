"use strict";

import {
    getGroupActivities,
    subscribeToGroupActivities
} from "../services/activity-service.js?activity-feed=1";
import {
    renderActivityEmpty,
    renderActivityError,
    renderActivityFeed,
    renderActivityLoading
} from "../renderers/activity-renderer.js?activity-feed=1";
import { error as logError } from "../utils/logger.js";

const activityControllers = new WeakMap();

export function initializeActivityFeed({
    container,
    groupId
} = {}) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Activity feed container is required.");
    }

    activityControllers.get(container)?.destroy();

    let destroyed = false;
    let unsubscribe = () => {};

    const controller = {
        destroy() {
            if (destroyed) return;

            destroyed = true;
            unsubscribe();
            unsubscribe = () => {};
            activityControllers.delete(container);
        }
    };

    activityControllers.set(container, controller);

    const cleanGroupId = typeof groupId === "string"
        ? groupId.trim()
        : "";

    if (!cleanGroupId) {
        renderActivityEmpty(container);
        return controller;
    }

    renderActivityLoading(container);

    const showError = (error) => {
        if (destroyed) return;

        logError("ACTIVITY", "Activity feed failed:", error);
        renderActivityError(container);
    };

    const start = async () => {
        try {
            const activities = await getGroupActivities(cleanGroupId);

            if (destroyed) return;

            renderActivityFeed(activities, container);
            unsubscribe = subscribeToGroupActivities(
                cleanGroupId,
                (nextActivities) => {
                    if (!destroyed) {
                        renderActivityFeed(nextActivities, container);
                    }
                },
                showError
            );
        } catch (error) {
            showError(error);
        }
    };

    start();
    return controller;
}
