import { useState } from "react";
import { NavLink } from "react-router-dom";

import Menu from "../../ui/Menu/index.js";
import { CHANNEL_TYPES } from "../../../config/channel-types.js";
import styles from "./ChannelItem.module.css";

function HashIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="20"
            viewBox="0 0 24 24"
            width="20"
        >
            <path
                d="M10 3 8 21M16 3l-2 18M4 9h17M3 15h17"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function AnnouncementIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="20"
            viewBox="0 0 24 24"
            width="20"
        >
            <path
                d="M4 13V9l13-5v14L4 13Zm0 0 2 7h4"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.7"
            />
        </svg>
    );
}

function MoreIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="currentColor"
            height="18"
            viewBox="0 0 24 24"
            width="18"
        >
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
        </svg>
    );
}

export default function ChannelItem({
    channel,
    communityId,
    manageable,
    onManage,
    onOpen,
    unreadCount = 0
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const announcement = channel.type === CHANNEL_TYPES.ANNOUNCEMENTS;

    return (
        <li className={styles.item}>
            <NavLink
                aria-label={`${announcement ? "Announcement" : "Text"} channel ${channel.name}`}
                className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.active : ""}`
                }
                onClick={onOpen}
                to={`/community/${communityId}/channel/${channel.id}`}
            >
                {announcement ? <AnnouncementIcon /> : <HashIcon />}
                <span>{channel.name}</span>
                {unreadCount ? (
                    <strong
                        aria-label={`${unreadCount} unread messages`}
                        className={styles.unread}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </strong>
                ) : null}
            </NavLink>
            {manageable ? (
                <div className={styles.actions}>
                    <button
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        aria-label={`Open settings for ${channel.name}`}
                        className={styles.more}
                        onClick={() => setMenuOpen((open) => !open)}
                        type="button"
                    >
                        <MoreIcon />
                    </button>
                    {menuOpen ? (
                        <Menu
                            aria-label={`${channel.name} channel actions`}
                            className={styles.menu}
                            items={[
                                {
                                    id: "settings",
                                    label: "Channel settings"
                                }
                            ]}
                            onBlur={(event) => {
                                if (
                                    !event.currentTarget.contains(
                                        event.relatedTarget
                                    )
                                ) {
                                    setMenuOpen(false);
                                }
                            }}
                            onSelect={() => {
                                setMenuOpen(false);
                                onManage(channel);
                            }}
                        />
                    ) : null}
                </div>
            ) : null}
        </li>
    );
}
