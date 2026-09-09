const FILE_ICON_MAP = Object.freeze({
    pdf: { category: "pdf", label: "PDF" },
    doc: { category: "document", label: "DOC" },
    docx: { category: "document", label: "DOC" },
    ppt: { category: "presentation", label: "PPT" },
    pptx: { category: "presentation", label: "PPT" },
    xls: { category: "spreadsheet", label: "XLS" },
    xlsx: { category: "spreadsheet", label: "XLS" },
    csv: { category: "spreadsheet", label: "CSV" },
    zip: { category: "archive", label: "ZIP" },
    txt: { category: "text", label: "TXT" },
    jpg: { category: "image", label: "IMG" },
    jpeg: { category: "image", label: "IMG" },
    png: { category: "image", label: "IMG" },
    gif: { category: "image", label: "GIF" },
    webp: { category: "image", label: "IMG" }
});

const GENERIC_ICON = Object.freeze({ category: "generic", label: "FILE" });

export function getFileIcon(extension) {
    return FILE_ICON_MAP[String(extension || "").toLowerCase()] || GENERIC_ICON;
}

export function isImageFile(file) {
    return getFileIcon(file?.extension).category === "image";
}

export function isPdfFile(file) {
    return String(file?.extension || "").toLowerCase() === "pdf";
}

export function isPreviewableFile(file) {
    return isImageFile(file) || isPdfFile(file);
}
