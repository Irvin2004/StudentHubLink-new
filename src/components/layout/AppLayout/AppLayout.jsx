import { useCallback, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import { MobileDrawer } from "../MobileDrawer/MobileDrawer.jsx";
import { Sidebar } from "../Sidebar/Sidebar.jsx";
import { Topbar } from "../Topbar/Topbar.jsx";
import styles from "./AppLayout.module.css";

export function AppLayout() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const menuButtonRef = useRef(null);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    return (
        <div className={styles.shell}>
            <a className={styles.skipLink} href="#main-content">
                Skip to main content
            </a>
            <MobileDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                returnFocusRef={menuButtonRef}
            >
                <Sidebar onNavigate={closeDrawer} />
            </MobileDrawer>
            <div className={styles.mainColumn}>
                <Topbar
                    menuButtonRef={menuButtonRef}
                    onMenuToggle={() => setDrawerOpen((open) => !open)}
                />
                <div
                    className={styles.pageOutlet}
                    id="main-content"
                    tabIndex="-1"
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
