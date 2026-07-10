import { escapeHtml } from "../utils/dom.js";

export function createSidebar(links, activeHref = "") {
    return `
        <aside class="sidebar">
            <div class="sidebar-logo">StudentHub</div>

            <nav class="sidebar-menu">
                ${links.map((link) => `
                    <a
                        href="${escapeHtml(link.href)}"
                        class="${link.href === activeHref ? "active" : ""}">
                        ${escapeHtml(link.label)}
                    </a>
                `).join("")}
            </nav>
        </aside>
    `;
}
