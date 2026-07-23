"use strict";

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase/firebase-config.js";
import {
    createUserSettings,
    mergeUserSettings
} from "../models/user-settings.js";

function getSettingsReference(userId) {
    if (!userId) {
        throw new Error("A user ID is required.");
    }

    return doc(
        db,
        "users",
        userId,
        "preferences",
        "settings"
    );
}

export async function getUserSettings(userId) {
    const reference = getSettingsReference(userId);
    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
        return createUserSettings();
    }

    return createUserSettings(snapshot.data());
}

export async function saveUserSettings(userId, settings) {
    const reference = getSettingsReference(userId);
    const validatedSettings = createUserSettings(settings);

    await setDoc(
        reference,
        {
            ...validatedSettings,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );

    return validatedSettings;
}

export async function updateUserSettings(userId, updates) {
    const currentSettings = await getUserSettings(userId);
    const updatedSettings = mergeUserSettings(
        currentSettings,
        updates
    );

    return saveUserSettings(userId, updatedSettings);
}

export function subscribeToUserSettings(
    userId,
    onSettingsChange,
    onError = console.error
) {
    const reference = getSettingsReference(userId);

    return onSnapshot(
        reference,
        (snapshot) => {
            const settings = snapshot.exists()
                ? createUserSettings(snapshot.data())
                : createUserSettings();

            onSettingsChange(settings);
        },
        onError
    );
}
