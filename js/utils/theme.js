const THEME_KEY = "studenthub-theme";

export function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
}

export function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    updateThemeButtons(theme);
}

export function toggleTheme() {
    const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";

    const nextTheme =
    currentTheme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
}

export function initializeTheme() {
    applyTheme(getSavedTheme());

    document.addEventListener("click", (event) => {
        const themeButton =
        event.target.closest("[data-theme-toggle]");

        if (!themeButton) return;

        toggleTheme();
    });
}

function updateThemeButtons(theme) {
    document
        .querySelectorAll("[data-theme-toggle]")
        .forEach((button) => {
            const darkModeActive =
            theme === "dark";

            button.textContent =
            darkModeActive ? "Light" : "Dark";

            button.setAttribute(
                "aria-label",
                darkModeActive ?
                "Switch to light mode" :
                "Switch to dark mode"
            );

            button.setAttribute(
                "title",
                darkModeActive ?
                "Switch to light mode" :
                "Switch to dark mode"
            );
        });
}
