import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import UploadProgress from "./UploadProgress.jsx";

test("shows transferred bytes and percentage while uploading", () => {
    render(
        <UploadProgress
            onCancel={vi.fn()}
            onRemove={vi.fn()}
            onRetry={vi.fn()}
            upload={{
                bytesTransferred: 512,
                file: { name: "notes.pdf", size: 2048 },
                id: "upload-1",
                progress: 25,
                status: "uploading",
                totalBytes: 2048
            }}
        />
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "25"
    );
    expect(screen.getByText("512 B of 2.0 KB uploaded")).toBeVisible();
});
