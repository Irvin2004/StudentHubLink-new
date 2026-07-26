import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "./auth-context.js";
import {
    login as loginUser,
    logout as logoutUser,
    onAuthStateChanged,
    register as registerUser,
    resetPassword as requestPasswordReset,
    updateProfile as updateUserProfile
} from "../services/auth-service.js";

let userProfileServicePromise;

function loadUserProfileService() {
    userProfileServicePromise ??= import("../services/user-profile-service.js");
    return userProfileServicePromise;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(
            async (nextUser) => {
                if (!active) return;

                setUser(nextUser);
                setError(null);
                setLoading(false);

                if (!nextUser) {
                    setProfile(null);
                    return;
                }

                try {
                    const { getUserProfile } = await loadUserProfileService();
                    const nextProfile = await getUserProfile(nextUser.uid);

                    if (active) setProfile(nextProfile);
                } catch (nextError) {
                    if (active) setError(nextError);
                }
            },
            (nextError) => {
                if (!active) return;
                setError(nextError);
                setLoading(false);
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const login = useCallback(
        (email, password) => loginUser(email, password),
        []
    );
    const register = useCallback((input) => registerUser(input), []);
    const logout = useCallback(() => logoutUser(), []);
    const resetPassword = useCallback(
        (email) => requestPasswordReset(email),
        []
    );
    const updateProfile = useCallback(async (data) => {
        const updatedUser = await updateUserProfile(data);
        const { getUserProfile } = await loadUserProfileService();
        const updatedProfile = await getUserProfile(updatedUser.uid);

        setUser(updatedUser);
        setProfile(updatedProfile);

        return updatedUser;
    }, []);

    const value = useMemo(
        () => ({
            error,
            loading,
            login,
            logout,
            profile,
            register,
            resetPassword,
            updateProfile,
            user
        }),
        [
            error,
            loading,
            login,
            logout,
            profile,
            register,
            resetPassword,
            updateProfile,
            user
        ]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
