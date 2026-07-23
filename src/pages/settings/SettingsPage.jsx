import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useSettings } from "../../hooks/useSettings.js";
import { useTheme } from "../../hooks/useTheme.js";

export default function SettingsPage() {
    useDocumentTitle("StudentHub - Settings", "react-app");

    const { settings, updateSettings } = useSettings();
    const { setTheme, theme } = useTheme();

    function handleThemeChange(event) {
        const nextTheme = event.target.value;
        setTheme(nextTheme);
        updateSettings({ theme: nextTheme });
    }

    return (
        <main className="react-page">
            <header className="react-page__heading">
                <div>
                    <h1>Settings</h1>
                    <p>Personalize how StudentHub looks and feels.</p>
                </div>
            </header>
            <section className="react-settings-panel">
                <label htmlFor="theme">Theme</label>
                <select id="theme" value={theme} onChange={handleThemeChange}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                </select>
                <label className="react-setting-toggle">
                    <input
                        type="checkbox"
                        checked={settings.reducedMotion}
                        onChange={(event) =>
                            updateSettings({
                                reducedMotion: event.target.checked
                            })
                        }
                    />
                    Reduce motion
                </label>
            </section>
        </main>
    );
}
