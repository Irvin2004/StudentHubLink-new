import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChannelEmptyState from "../../components/channels/ChannelEmptyState/ChannelEmptyState.jsx";
import ChannelHeader from "../../components/channels/ChannelHeader/ChannelHeader.jsx";
import ChannelList from "../../components/channels/ChannelList/ChannelList.jsx";
import ChannelSettingsModal from "../../components/channels/ChannelSettingsModal/ChannelSettingsModal.jsx";
import CreateChannelModal from "../../components/channels/CreateChannelModal/CreateChannelModal.jsx";
import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import PerformanceProfiler from "../../components/performance/PerformanceProfiler.jsx";
import ChatMessageSkeleton from "../../components/Skeleton/ChatMessageSkeleton.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import { ROUTES } from "../../config/routes.js";
import { useChannels } from "../../hooks/useChannels.js";
import { useCommunity } from "../../hooks/useCommunity.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useObservability } from "../../hooks/useObservability.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./CommunityPage.module.css";

const ChatPage = lazy(() => import("../chat/ChatPage.jsx"));

function CommunityMark({ name }) {
    const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return (
        <span aria-hidden="true" className={styles.communityMark}>
            {initials}
        </span>
    );
}

function CommunityHeaderSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading community"
            className={styles.headerSkeleton}
        >
            <Skeleton height="3.25rem" variant="circle" width="3.25rem" />
            <div>
                <Skeleton height="1.5rem" width="12rem" />
                <Skeleton height="1rem" width="7rem" />
            </div>
        </div>
    );
}

export default function CommunityPage() {
    const { communityId, channelId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { captureError, getActionableErrorMessage } = useObservability();
    const [createOpen, setCreateOpen] = useState(false);
    const [managedChannel, setManagedChannel] = useState(null);
    const announcementRef = useRef(null);
    const {
        channels,
        loading: channelsLoading,
        error,
        createChannel,
        updateChannel,
        deleteChannel
    } = useChannels(communityId);
    const {
        community,
        role,
        loading: communityLoading,
        error: communityError
    } = useCommunity(communityId);

    const selectedChannel = useMemo(
        () => channels.find((channel) => channel.id === channelId) || null,
        [channelId, channels]
    );

    useDocumentTitle(
        community
            ? `StudentHub - ${community.name}${selectedChannel ? ` #${selectedChannel.name}` : ""}`
            : "StudentHub - Community",
        "react-app"
    );

    useEffect(() => {
        if (!selectedChannel) return;

        announcementRef.current.textContent = `Selected channel ${selectedChannel.name}.`;
    }, [selectedChannel]);

    useEffect(() => {
        if (!error) return;

        captureError(error, { feature: "community_channels" });
        showToast({
            title: "Channels unavailable",
            message: getActionableErrorMessage(error, "channels"),
            type: "error"
        });
    }, [captureError, error, getActionableErrorMessage, showToast]);

    useEffect(() => {
        if (!communityError) return;

        captureError(communityError, { feature: "community_details" });
        showToast({
            title: "Community unavailable",
            message: getActionableErrorMessage(communityError, "community"),
            type: "error"
        });
    }, [captureError, communityError, getActionableErrorMessage, showToast]);

    async function handleCreate(input) {
        const channel = await createChannel(input);
        showToast({
            title: "Channel created",
            message: `#${channel.name} is ready.`,
            type: "success"
        });
        navigate(`/community/${communityId}/channel/${channel.id}`);
        return channel;
    }

    async function handleUpdate(id, updates) {
        await updateChannel(id, updates);
        showToast({
            title: "Channel updated",
            message: "Your channel settings were saved.",
            type: "success"
        });
    }

    async function handleDelete(id) {
        await deleteChannel(id);
        showToast({
            title: "Channel deleted",
            message: "The channel was removed.",
            type: "info"
        });
        navigate(`/community/${communityId}/channel/general`);
    }

    if (!communityLoading && communityError && !community) {
        return (
            <main className={`${styles.page} ${styles.pageState}`}>
                <LoadErrorState
                    description="We could not open this community. It may be unavailable or you may no longer have access."
                    onRetry={() => navigate(ROUTES.COMMUNITIES)}
                    title="Community unavailable"
                />
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <header className={styles.communityHeader}>
                {communityLoading || !community ? (
                    <CommunityHeaderSkeleton />
                ) : (
                    <>
                        <CommunityMark name={community.name} />
                        <div>
                            <h1>{community.name}</h1>
                            <p>
                                {community.memberCount.toLocaleString()}{" "}
                                {community.memberCount === 1
                                    ? "member"
                                    : "members"}
                            </p>
                        </div>
                    </>
                )}
            </header>
            <div
                className={styles.workspace}
                data-channel-selected={Boolean(selectedChannel) || undefined}
            >
                <ChannelList
                    channels={channels}
                    communityId={communityId}
                    loading={channelsLoading}
                    onCreate={() => setCreateOpen(true)}
                    onManage={setManagedChannel}
                    role={role}
                />
                <section
                    aria-label={
                        selectedChannel
                            ? `${selectedChannel.name} channel`
                            : "Channel content"
                    }
                    className={styles.channelArea}
                >
                    {!channelsLoading && error && !channels.length ? (
                        <LoadErrorState
                            description="We could not load this community's channels."
                            title="Channels unavailable"
                        />
                    ) : selectedChannel ? (
                        <>
                            <ChannelHeader channel={selectedChannel} />
                            <Suspense
                                fallback={<ChatMessageSkeleton count={4} />}
                            >
                                <PerformanceProfiler id="ChatPage">
                                    <ChatPage
                                        channel={selectedChannel}
                                        communityId={communityId}
                                        role={role}
                                    />
                                </PerformanceProfiler>
                            </Suspense>
                        </>
                    ) : (
                        <ChannelEmptyState />
                    )}
                </section>
            </div>
            <p
                aria-live="polite"
                className={styles.srOnly}
                ref={announcementRef}
            />
            <CreateChannelModal
                communityName={community?.name || "this community"}
                onClose={() => setCreateOpen(false)}
                onCreate={handleCreate}
                open={createOpen}
            />
            <ChannelSettingsModal
                channel={managedChannel}
                key={managedChannel?.id || "no-managed-channel"}
                onClose={() => setManagedChannel(null)}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                open={Boolean(managedChannel)}
            />
        </main>
    );
}
