import { CHANNEL_TYPES } from "../../../config/channel-types.js";
import styles from "./ChannelHeader.module.css";

function HashIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="28"
            viewBox="0 0 24 24"
            width="28"
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
            height="28"
            viewBox="0 0 24 24"
            width="28"
        >
            <path
                d="M4 13V9l13-5v14L4 13Zm0 0 2 7h4l-1.5-5.5M17 9h3v4h-3"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.7"
            />
        </svg>
    );
}

export default function ChannelHeader({ channel }) {
    if (!channel) return null;

    const announcement = channel.type === CHANNEL_TYPES.ANNOUNCEMENTS;

    return (
        <header className={styles.header}>
            <span className={styles.icon}>
                {announcement ? <AnnouncementIcon /> : <HashIcon />}
            </span>
            <div>
                <h2>{channel.name}</h2>
                <p>
                    {channel.description || `Conversation in #${channel.name}.`}
                </p>
            </div>
        </header>
    );
}
