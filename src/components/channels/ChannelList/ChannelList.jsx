import { useCallback, useMemo, useState } from "react";

import Button from "../../ui/Button/index.js";
import Skeleton from "../../Skeleton/Skeleton.jsx";
import ChannelItem from "../ChannelItem/ChannelItem.jsx";
import ChannelSearch from "../ChannelSearch/ChannelSearch.jsx";
import {
    canCreateChannel,
    canManageChannel
} from "../../../config/channel-permissions.js";
import { useNotifications } from "../../../hooks/useNotifications.js";
import styles from "./ChannelList.module.css";

function PlusIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
        >
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
            />
        </svg>
    );
}

function handleListKeyDown(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
    }

    const links = [...event.currentTarget.querySelectorAll("a[href]")];
    const currentIndex = links.indexOf(document.activeElement);
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown")
        nextIndex = (currentIndex + 1) % links.length;
    if (event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + links.length) % links.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = links.length - 1;

    if (links[nextIndex]) {
        event.preventDefault();
        links[nextIndex].focus();
    }
}

export default function ChannelList({
    channels,
    communityId,
    loading,
    onCreate,
    onManage,
    role
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const { notifications, setRead } = useNotifications();
    const handleSearch = useCallback((value) => setSearchTerm(value), []);
    const filteredChannels = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return query
            ? channels.filter((channel) => channel.name.includes(query))
            : channels;
    }, [channels, searchTerm]);
    const unreadByChannel = useMemo(() => {
        const counts = new Map();
        notifications.forEach((item) => {
            if (
                !item.read &&
                item.communityId === communityId &&
                item.channelId
            ) {
                counts.set(
                    item.channelId,
                    (counts.get(item.channelId) || 0) + 1
                );
            }
        });
        return counts;
    }, [communityId, notifications]);

    function markChannelRead(channelId) {
        notifications
            .filter(
                (item) =>
                    !item.read &&
                    item.communityId === communityId &&
                    item.channelId === channelId
            )
            .forEach((item) => void setRead(item.id, true));
    }

    return (
        <aside aria-label="Community channels" className={styles.sidebar}>
            <div className={styles.labelRow}>
                <h2>Text channels</h2>
                <span>{channels.length}</span>
            </div>
            <ChannelSearch onSearch={handleSearch} />
            {loading ? (
                <div
                    aria-busy="true"
                    aria-label="Loading channels"
                    className={styles.skeletons}
                >
                    <Skeleton height="1.15rem" width="78%" />
                    <Skeleton height="1.15rem" width="56%" />
                    <Skeleton height="1.15rem" width="68%" />
                </div>
            ) : (
                <ul
                    aria-label="Text channels"
                    className={styles.list}
                    onKeyDown={handleListKeyDown}
                >
                    {filteredChannels.map((channel) => (
                        <ChannelItem
                            channel={channel}
                            communityId={communityId}
                            key={channel.id}
                            manageable={canManageChannel(role)}
                            onManage={onManage}
                            onOpen={() => markChannelRead(channel.id)}
                            unreadCount={unreadByChannel.get(channel.id) || 0}
                        />
                    ))}
                </ul>
            )}
            {!loading && filteredChannels.length === 0 ? (
                <p className={styles.noResults}>No channels found.</p>
            ) : null}
            {canCreateChannel(role) ? (
                <div className={styles.create}>
                    <Button
                        icon={<PlusIcon />}
                        onClick={onCreate}
                        variant="ghost"
                    >
                        Create channel
                    </Button>
                </div>
            ) : null}
        </aside>
    );
}
