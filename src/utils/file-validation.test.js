import { describe, expect, test } from "vitest";

import {
    MAX_FILE_SIZE,
    sanitizeStorageFileName,
    validateFile
} from "./file-validation.js";

describe("file validation", () => {
    test("accepts supported, non-empty files", () => {
        const file = new File(["notes"], "Course Notes.PDF", {
            type: "application/pdf"
        });

        expect(validateFile(file)).toEqual(
            expect.objectContaining({
                extension: "pdf",
                originalName: "Course Notes.PDF",
                size: 5
            })
        );
    });

    test.each([
        [new File([], "empty.pdf"), "Empty files"],
        [new File(["x"], "script.exe"), "not supported"],
        [new File(["x"], "bad?.pdf"), "invalid characters"]
    ])("rejects invalid files", (file, message) => {
        expect(() => validateFile(file)).toThrow(message);
    });

    test("rejects oversized files", () => {
        const file = new File(["x"], "large.pdf");
        Object.defineProperty(file, "size", { value: MAX_FILE_SIZE + 1 });
        expect(() => validateFile(file)).toThrow("25 MB");
    });

    test("sanitizes storage names", () => {
        expect(sanitizeStorageFileName("My Final Résumé.pdf")).toBe(
            "my-final-resume.pdf"
        );
    });
});
