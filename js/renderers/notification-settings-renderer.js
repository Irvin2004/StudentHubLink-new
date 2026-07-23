"use strict";

const NOTIFICATION_GROUPS = Object.freeze([
    {
        title: "Messages",
        options: [
            {
                key: "directMessages",
                label: "Direct Messages",
                description: "Notify me when someone sends me a direct message."
            },
            {
                key: "groupMessages",
                label: "Group Messages",
                description: "Notify me about new messages in my study groups."
            },
            {
                key: "mentions",
                label: "Mentions",
                description: "Notify me when someone mentions me in a message."
            }
        ]
    },
    {
        title: "Activity",
        options: [
            {
                key: "reactions",
                label: "Reactions",
                description: "Notify me when someone reacts to my message."
            },
            {
                key: "readReceipts",
                label: "Read Receipts",
                description: "Notify me when someone reads my direct message."
            }
        ]
    }
]);

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Notification settings container is required.");
    }
}

function renderCheckbox(option, checked, disabled = false) {
    const descriptionId = `notification-${option.key}-description`;

    return `
        <div class="notification-setting">
            <label class="notification-setting__control">
                <input
                    type="checkbox"
                    data-notification-setting="${option.key}"
                    aria-describedby="${descriptionId}"
                    ${checked ? "checked" : ""}
                    ${disabled ? "disabled" : ""}
                >
                <span>${option.label}</span>
            </label>
            <p
                id="${descriptionId}"
                class="notification-setting__description"
            >
                ${option.description}
            </p>
        </div>
    `;
}

export function renderNotificationSettings(notifications = {}, container) {
    requireContainer(container);

    const dependentsDisabled = notifications.enabled !== true;
    const groups = NOTIFICATION_GROUPS.map(
        (group) => `
        <section
            class="notification-settings__group"
            aria-labelledby="notification-${group.title.toLowerCase()}"
        >
            <h3 id="notification-${group.title.toLowerCase()}">
                ${group.title}
            </h3>
            ${group.options
                .map((option) =>
                    renderCheckbox(
                        option,
                        notifications[option.key] === true,
                        dependentsDisabled
                    )
                )
                .join("")}
        </section>
    `
    ).join("");

    const html = `
        <section
            class="notification-settings"
            aria-labelledby="notification-settings-title"
        >
            <h2 id="notification-settings-title">Notifications</h2>
            ${renderCheckbox(
                {
                    key: "enabled",
                    label: "Enable Notifications",
                    description: "Turn all StudentHub notifications on or off."
                },
                notifications.enabled === true
            )}
            ${groups}
        </section>
    `;

    container.innerHTML = html;
    return html;
}

export function clearNotificationSettings(container) {
    requireContainer(container);
    container.innerHTML = "";
}
