export function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function setText(id, value) {
    const element =
    document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

export function setMessage(id, value, type = "") {
    const element =
    document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = value;
    element.classList.remove("error", "success");

    if (type) {
        element.classList.add(type);
    }
}

export function setButtonLoading(button, isLoading, loadingText) {
    if (!button) {
        return;
    }

    if (!button.dataset.defaultText) {
        button.dataset.defaultText =
        button.textContent.trim();
    }

    button.disabled = isLoading;
    button.textContent =
    isLoading ? loadingText : button.dataset.defaultText;
}
