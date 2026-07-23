"use strict";

import {
    getUserSettings,
    updateUserSettings,
    subscribeToUserSettings
} from "../services/settings-service.js";

export function createSettingsController({
    userId,
    onSettingsChange = () => {},
    onError = console.error
} = {}) {
    if (!userId) {
        throw new Error("Settings controller requires a user ID.");
    }

    let settings = null;
    let unsubscribe = null;
    let destroyed = false;

    async function initialize() {
        try {
            settings = await getUserSettings(userId);
            onSettingsChange(settings);

            unsubscribe = subscribeToUserSettings(
                userId,
                (updatedSettings) => {
                    if (destroyed) {
                        return;
                    }

                    settings = updatedSettings;
                    onSettingsChange(settings);
                },
                onError
            );

            return settings;
        } catch (error) {
            onError(error);
            throw error;
        }
    }

    function getSettings() {
        return settings ? { ...settings } : null;
    }

    async function updateSetting(name, value) {
        if (destroyed) {
            throw new Error("Settings controller has been destroyed.");
        }

        if (!settings) {
            throw new Error("Settings controller is not initialized.");
        }

        const updatedSettings = await updateUserSettings(
            userId,
            {
                [name]: value
            }
        );

        settings = updatedSettings;
        return updatedSettings;
    }

    async function updateSettings(updates) {
        if (destroyed) {
            throw new Error("Settings controller has been destroyed.");
        }

        if (!settings) {
            throw new Error("Settings controller is not initialized.");
        }

        const updatedSettings = await updateUserSettings(
            userId,
            updates
        );

        settings = updatedSettings;
        return updatedSettings;
    }

    function destroy() {
        destroyed = true;

        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        settings = null;
    }

    return {
        initialize,
        getSettings,
        updateSetting,
        updateSettings,
        destroy
    };
}
