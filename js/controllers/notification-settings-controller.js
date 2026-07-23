"use strict";

import {
    clearNotificationSettings,
    renderNotificationSettings
} from "../renderers/notification-settings-renderer.js";

const NOTIFICATION_FIELDS = new Set([
    "enabled",
    "directMessages",
    "groupMessages",
    "mentions",
    "reactions",
    "readReceipts"
]);

export function createNotificationSettingsController({
    container,
    settingsController,
    onError = console.error
} = {}) {
    if (
        !container?.addEventListener ||
        !("innerHTML" in container)
    ) {
        throw new Error("Notification settings container is required.");
    }

    if (
        typeof settingsController?.getSettings !== "function" ||
        typeof settingsController?.updateSettings !== "function"
    ) {
        throw new Error(
            "Notification settings require a settings controller."
        );
    }

    const documentReference =
        container.ownerDocument || globalThis.document;
    let notifications = null;
    let initialized = false;
    let destroyed = false;
    let updateSequence = 0;

    function syncNotifications(nextNotifications) {
        if (!nextNotifications || typeof nextNotifications !== "object") {
            return false;
        }

        notifications = { ...nextNotifications };
        renderNotificationSettings(notifications, container);
        return true;
    }

    async function initialize() {
        if (destroyed) {
            throw new Error(
                "Notification settings controller has been destroyed."
            );
        }

        if (initialized) {
            return { ...notifications };
        }

        let settings = settingsController.getSettings();

        if (!settings && typeof settingsController.initialize === "function") {
            settings = await settingsController.initialize();
        }

        if (!syncNotifications(settings?.notifications)) {
            throw new Error("Notification settings are unavailable.");
        }

        container.addEventListener("change", handleChange);
        documentReference?.addEventListener?.(
            "studenthub:settings-changed",
            handleSettingsChange
        );
        initialized = true;

        return { ...notifications };
    }

    function getNotificationSettings() {
        return notifications ? { ...notifications } : null;
    }

    async function handleChange(event) {
        const checkbox = event.target?.closest?.(
            "[data-notification-setting]"
        );
        const field = checkbox?.dataset?.notificationSetting;

        if (
            destroyed ||
            !NOTIFICATION_FIELDS.has(field) ||
            checkbox.disabled
        ) {
            return;
        }

        const previousNotifications = { ...notifications };
        const nextNotifications = {
            ...notifications,
            [field]: checkbox.checked === true
        };
        const sequence = ++updateSequence;

        syncNotifications(nextNotifications);

        try {
            const updatedSettings =
                await settingsController.updateSettings({
                    notifications: nextNotifications
                });

            if (destroyed || sequence !== updateSequence) {
                return;
            }

            syncNotifications(updatedSettings.notifications);
        } catch (error) {
            if (!destroyed && sequence === updateSequence) {
                syncNotifications(previousNotifications);
                onError(error);
            }
        }
    }

    function handleSettingsChange(event) {
        if (!destroyed) {
            syncNotifications(event.detail?.notifications);
        }
    }

    function destroy() {
        if (destroyed) {
            return;
        }

        destroyed = true;
        updateSequence += 1;
        container.removeEventListener("change", handleChange);
        documentReference?.removeEventListener?.(
            "studenthub:settings-changed",
            handleSettingsChange
        );
        clearNotificationSettings(container);
        notifications = null;
        initialized = false;
    }

    return {
        initialize,
        getNotificationSettings,
        destroy
    };
}
