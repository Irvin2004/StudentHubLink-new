import { describe, expect, test } from "vitest";

import { canDeleteFile, createFileModel } from "./file.js";

const file = createFileModel({
    id: "file-1",
    originalName: "assignment.pdf",
    uploadedBy: "user-1"
});

describe("file model permissions", () => {
    test("allows uploaders, owners and admins to delete", () => {
        expect(canDeleteFile(file, "user-1", "member")).toBe(true);
        expect(canDeleteFile(file, "user-2", "owner")).toBe(true);
        expect(canDeleteFile(file, "user-2", "admin")).toBe(true);
    });

    test("prevents other members and moderators from deleting", () => {
        expect(canDeleteFile(file, "user-2", "member")).toBe(false);
        expect(canDeleteFile(file, "user-2", "moderator")).toBe(false);
    });
});
