let menu;

export function createMessageMenu() {
    if (menu) {
        return menu;
    }

    menu = document.createElement("div");
    menu.id = "messageMenu";
    menu.className = "message-menu hidden";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Message actions");

    menu.innerHTML = `
        <button
            type="button"
            role="menuitem"
            data-action="react"
            data-visible="always">
            &#128077; React
        </button>

        <button
            type="button"
            role="menuitem"
            data-action="reply"
            data-visible="always">
            &#8617; Reply
        </button>

        <button
            type="button"
            role="menuitem"
            data-action="copy"
            data-visible="text">
            &#128203; Copy
        </button>

        <button
            type="button"
            role="menuitem"
            data-action="copy-link"
            data-visible="attachment">
            &#128279; Copy Link
        </button>

        <button
            type="button"
            role="menuitem"
            data-action="edit"
            data-visible="own-text">
            &#9998; Edit
        </button>

        <button
            type="button"
            role="menuitem"
            data-action="delete"
            data-visible="always">
            &#128465; Delete
        </button>
    `;

    document.body.appendChild(menu);

    return menu;
}

export function showMessageMenu(
    x,
    y,
    message,
    currentUserId
) {
    const messageMenu = createMessageMenu();
    const viewportInset = 8;
    const isOwn =
        message?.senderId === currentUserId;
    const isText =
        !message?.type || message.type === "text";
    const isAttachment =
        message?.type === "image" ||
        message?.type === "file";
    const isDeleted =
        message?.deleted === true ||
        Boolean(message?.deletedAt);

    messageMenu
        .querySelectorAll("button")
        .forEach((button) => {
            const visibility = button.dataset.visible;

            button.hidden = isDeleted
                ? button.dataset.action !== "delete"
                : !(
                visibility === "always" ||
                (visibility === "text" && isText) ||
                (visibility === "attachment" && isAttachment) ||
                (visibility === "own" && isOwn) ||
                (
                    visibility === "own-text" &&
                    isOwn &&
                    isText
                )
            );
        });

    messageMenu.classList.remove("hidden");
    messageMenu.dataset.messageId = message?.id || "";

    const menuRect = messageMenu.getBoundingClientRect();
    const maxLeft = Math.max(
        viewportInset,
        window.innerWidth - menuRect.width - viewportInset
    );
    const maxTop = Math.max(
        viewportInset,
        window.innerHeight - menuRect.height - viewportInset
    );
    const left = Math.min(
        Math.max(x, viewportInset),
        maxLeft
    );
    const top = Math.min(
        Math.max(y, viewportInset),
        maxTop
    );

    messageMenu.style.left = `${left}px`;
    messageMenu.style.top = `${top}px`;

    messageMenu
        .querySelector("button:not([hidden])")
        ?.focus();
}

export function hideMessageMenu() {
    const messageMenu =
        document.getElementById("messageMenu");

    messageMenu?.classList.add("hidden");
}
