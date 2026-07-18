export function initializeDropdowns(root = document) {
    root.addEventListener("click", (event) => {
        const toggle = event.target.closest("[data-dropdown-toggle]");

        document.querySelectorAll(".dropdown.is-open").forEach((dropdown) => {
            if (!toggle || dropdown !== toggle.closest(".dropdown")) dropdown.classList.remove("is-open");
        });

        if (!toggle) return;
        const dropdown = toggle.closest(".dropdown");
        const isOpen = dropdown?.classList.toggle("is-open") || false;
        toggle.setAttribute("aria-expanded", String(isOpen));
    });
}
