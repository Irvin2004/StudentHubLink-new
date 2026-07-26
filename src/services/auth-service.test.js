import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    auth: { currentUser: null },
    createAccount: vi.fn(),
    createProfile: vi.fn(),
    deleteUser: vi.fn(),
    initializePersistence: vi.fn(),
    observeAuthState: vi.fn(),
    resetPassword: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateFirebaseProfile: vi.fn(),
    updateProfileDocument: vi.fn()
}));

vi.mock("firebase/auth", () => ({
    createUserWithEmailAndPassword: mocks.createAccount,
    deleteUser: mocks.deleteUser,
    onAuthStateChanged: mocks.observeAuthState,
    sendPasswordResetEmail: mocks.resetPassword,
    signInWithEmailAndPassword: mocks.signIn,
    signOut: mocks.signOut,
    updateProfile: mocks.updateFirebaseProfile
}));

vi.mock("../firebase/auth.js", () => ({
    auth: mocks.auth,
    initializeAuthPersistence: mocks.initializePersistence
}));

vi.mock("./user-profile-service.js", () => ({
    createUserProfileDocument: mocks.createProfile,
    updateUserProfileDocument: mocks.updateProfileDocument
}));

import {
    login,
    onAuthStateChanged,
    register,
    updateProfile
} from "./auth-service.js";

describe("auth service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.currentUser = null;
        mocks.initializePersistence.mockResolvedValue();
    });

    it("establishes persistence before signing in", async () => {
        const user = { uid: "user-1" };

        mocks.signIn.mockResolvedValue({ user });

        await expect(login(" Alice@Example.com ", "secret")).resolves.toBe(
            user
        );
        expect(mocks.initializePersistence).toHaveBeenCalledOnce();
        expect(mocks.signIn).toHaveBeenCalledWith(
            mocks.auth,
            "alice@example.com",
            "secret"
        );
    });

    it("creates a normalized profile after registration", async () => {
        const user = { uid: "user-2", email: "student@example.com" };

        mocks.createAccount.mockResolvedValue({ user });

        await expect(
            register({
                fullName: "  Student Name  ",
                email: " Student@Example.com ",
                password: "password"
            })
        ).resolves.toBe(user);

        expect(mocks.updateFirebaseProfile).toHaveBeenCalledWith(user, {
            displayName: "Student Name"
        });
        expect(mocks.createProfile).toHaveBeenCalledWith(user, {
            fullName: "Student Name"
        });
    });

    it("removes an orphaned account when profile creation fails", async () => {
        const user = { uid: "user-3", email: "student@example.com" };
        const failure = new Error("Profile write failed");

        mocks.createAccount.mockResolvedValue({ user });
        mocks.createProfile.mockRejectedValue(failure);

        await expect(
            register({
                fullName: "Student Name",
                email: "student@example.com",
                password: "password"
            })
        ).rejects.toBe(failure);
        expect(mocks.deleteUser).toHaveBeenCalledWith(user);
    });

    it("updates Firebase Auth and Firestore through service boundaries", async () => {
        const user = { uid: "user-4" };

        mocks.auth.currentUser = user;

        await expect(
            updateProfile({
                displayName: "  Updated Student  ",
                photoURL: "https://example.com/photo.jpg"
            })
        ).resolves.toBe(user);

        const expectedUpdates = {
            displayName: "Updated Student",
            photoURL: "https://example.com/photo.jpg"
        };

        expect(mocks.updateFirebaseProfile).toHaveBeenCalledWith(
            user,
            expectedUpdates
        );
        expect(mocks.updateProfileDocument).toHaveBeenCalledWith(
            user.uid,
            expectedUpdates
        );
    });

    it("waits for persistence before observing auth state and cleans up", async () => {
        const callback = vi.fn();
        const unsubscribeFirebase = vi.fn();

        mocks.observeAuthState.mockReturnValue(unsubscribeFirebase);

        const unsubscribe = onAuthStateChanged(callback);

        await vi.waitFor(() => {
            expect(mocks.observeAuthState).toHaveBeenCalledWith(
                mocks.auth,
                callback,
                expect.any(Function)
            );
        });

        unsubscribe();
        expect(unsubscribeFirebase).toHaveBeenCalledOnce();
    });
});
