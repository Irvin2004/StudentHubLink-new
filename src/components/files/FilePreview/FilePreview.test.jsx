import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import FilePreview from "./FilePreview.jsx";

const baseFile = {
    originalName: "Study guide.pdf",
    size: 2048,
    uploadedByName: "Ari",
    url: "https://files.test/study-guide.pdf"
};

test("previews supported PDF files inside the modal", () => {
    render(
        <FilePreview
            file={{ ...baseFile, extension: "pdf" }}
            onClose={vi.fn()}
            onDownload={vi.fn()}
        />
    );

    expect(screen.getByTitle("Preview of Study guide.pdf")).toHaveAttribute(
        "src",
        "https://files.test/study-guide.pdf#toolbar=0&navpanes=0"
    );
});

test("previews supported images and keeps a comfortable download action", () => {
    const onDownload = vi.fn();
    const file = {
        ...baseFile,
        extension: "png",
        originalName: "Diagram.png",
        url: "https://files.test/diagram.png"
    };
    render(
        <FilePreview file={file} onClose={vi.fn()} onDownload={onDownload} />
    );

    expect(screen.getByAltText("Preview of Diagram.png")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownload).toHaveBeenCalledWith(file);
});

test("falls back to download messaging for unsupported files", () => {
    render(
        <FilePreview
            file={{ ...baseFile, extension: "docx" }}
            onClose={vi.fn()}
            onDownload={vi.fn()}
        />
    );

    expect(
        screen.getByText(
            "This file type does not support an in-app preview. Download it to open it."
        )
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Download" })).toBeVisible();
});
