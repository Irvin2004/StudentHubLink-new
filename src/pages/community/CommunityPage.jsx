import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import ChannelEmptyState from "../../components/channels/ChannelEmptyState/ChannelEmptyState.jsx";
import ChannelHeader from "../../components/channels/ChannelHeader/ChannelHeader.jsx";
import ChannelList from "../../components/channels/ChannelList/ChannelList.jsx";
import ChannelSettingsModal from "../../components/channels/ChannelSettingsModal/ChannelSettingsModal.jsx";
import CreateChannelModal from "../../components/channels/CreateChannelModal/CreateChannelModal.jsx";
import CommunitySettingsModal from "../../components/communities/CommunitySettingsModal/index.js";
import Button from "../../components/ui/Button/index.js";
import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import PerformanceProfiler from "../../components/performance/PerformanceProfiler.jsx";
import ChatMessageSkeleton from "../../components/Skeleton/ChatMessageSkeleton.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import { ROUTES } from "../../config/routes.js";
import { useChannels } from "../../hooks/useChannels.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useCommunity } from "../../hooks/useCommunity.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useObservability } from "../../hooks/useObservability.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./CommunityPage.module.css";

const ChatPage = lazy(() => import("../chat/ChatPage.jsx"));
const CommunityQuestions = lazy(
    () =>
        import("../../features/communityQuestions/components/CommunityQuestions.jsx")
);
const CommunityKnowledgeCollections = lazy(
    () =>
        import("../../features/knowledgeCollections/components/CommunityKnowledgeCollections.jsx")
);

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
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const { showToast } = useToast();
    const { captureError, getActionableErrorMessage } = useObservability();
    const [createOpen, setCreateOpen] = useState(false);
    const [managedChannel, setManagedChannel] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
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
        members,
        loading: communityLoading,
        membersLoading,
        membersLoadingMore,
        hasMoreMembers,
        error: communityError,
        membersError,
        refreshMembers,
        loadMoreMembers,
        saveCommunity,
        deleteCommunity,
        leaveCommunity,
        removeCommunityMember,
        changeCommunityMemberRole
    } = useCommunity(communityId, { loadMembers: settingsOpen });

    const selectedChannel = useMemo(
        () => channels.find((channel) => channel.id === channelId) || null,
        [channelId, channels]
    );
    const questionsView = location.pathname.endsWith("/questions");
    const collectionsView = location.pathname.endsWith("/collections");

    useDocumentTitle(
        community
            ? `StudentHub - ${community.name}${questionsView ? " Q&A" : collectionsView ? " Knowledge Collections" : selectedChannel ? ` #${selectedChannel.name}` : ""}`
            : "StudentHub - Community",
        "react-app"
    );

    useEffect(() => {
        if (!selectedChannel || questionsView || collectionsView) return;

        announcementRef.current.textContent = `Selected channel ${selectedChannel.name}.`;
    }, [collectionsView, questionsView, selectedChannel]);

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

    async function handleCommunitySave(updates) {
        await saveCommunity(updates);
        showToast({
            title: "Community updated",
            message: "Community settings were saved.",
            type: "success"
        });
    }

    async function handleRoleChange(member, nextRole) {
        await changeCommunityMemberRole(member.userId, nextRole);
        showToast({
            title: "Role updated",
            message: `${member.displayName} is now a ${nextRole}.`,
            type: "success"
        });
    }

    async function handleRemoveMember(member) {
        await removeCommunityMember(member.userId);
        showToast({
            title: "Member removed",
            message: `${member.displayName} was removed from the community.`,
            type: "info"
        });
    }

    async function handleLeaveCommunity() {
        await leaveCommunity();
        showToast({
            title: "Community left",
            message: `You left ${community.name}.`,
            type: "info"
        });
        navigate(ROUTES.COMMUNITIES);
    }

    async function handleDeleteCommunity() {
        await deleteCommunity();
        showToast({
            title: "Community deleted",
            message: `${community.name} was permanently deleted.`,
            type: "info"
        });
        navigate(ROUTES.COMMUNITIES);
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
                        <div className={styles.communityIdentity}>
                            <h1>{community.name}</h1>
                            <p>
                                {community.memberCount.toLocaleString()}{" "}
                                {community.memberCount === 1
                                    ? "member"
                                    : "members"}
                            </p>
                        </div>
                        {role ? (
                            <div className={styles.headerActions}>
                                <Button
                                    onClick={() =>
                                        navigate(
                                            `/community/${communityId}/channel/${channels[0]?.id || "general"}`
                                        )
                                    }
                                    variant={
                                        !questionsView && !collectionsView
                                            ? "primary"
                                            : "outline"
                                    }
                                >
                                    Channels
                                </Button>
                                <Button
                                    onClick={() =>
                                        navigate(
                                            `/community/${communityId}/questions`
                                        )
                                    }
                                    variant={
                                        questionsView ? "primary" : "outline"
                                    }
                                >
                                    Questions & Answers
                                </Button>
                                <Button
                                    onClick={() =>
                                        navigate(
                                            `/community/${communityId}/collections`
                                        )
                                    }
                                    variant={
                                        collectionsView ? "primary" : "outline"
                                    }
                                >
                                    Knowledge Collections
                                </Button>
                                <Button
                                    onClick={() => setSettingsOpen(true)}
                                    variant="outline"
                                >
                                    Community settings
                                </Button>
                            </div>
                        ) : null}
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
                        questionsView
                            ? "Community questions and answers"
                            : collectionsView
                              ? "Community knowledge collections"
                              : selectedChannel
                                ? `${selectedChannel.name} channel`
                                : "Channel content"
                    }
                    className={styles.channelArea}
                >
                    {questionsView ? (
                        <Suspense fallback={<ChatMessageSkeleton count={4} />}>
                            <PerformanceProfiler id="CommunityQuestions">
                                <CommunityQuestions
                                    actor={{
                                        communityId,
                                        displayName:
                                            profile?.displayName ||
                                            profile?.fullName ||
                                            user?.displayName ||
                                            "Student",
                                        id: user?.uid
                                    }}
                                    role={role}
                                />
                            </PerformanceProfiler>
                        </Suspense>
                    ) : collectionsView ? (
                        <Suspense fallback={<ChatMessageSkeleton count={4} />}>
                            <PerformanceProfiler id="CommunityKnowledgeCollections">
                                <CommunityKnowledgeCollections
                                    actor={{
                                        communityId,
                                        displayName:
                                            profile?.displayName ||
                                            profile?.fullName ||
                                            user?.displayName ||
                                            "Student",
                                        id: user?.uid
                                    }}
                                    role={role}
                                />
                            </PerformanceProfiler>
                        </Suspense>
                    ) : !channelsLoading && error && !channels.length ? (
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
            {community ? (
                <CommunitySettingsModal
                    community={community}
                    currentUserId={user?.uid}
                    error={membersError}
                    hasMoreMembers={hasMoreMembers}
                    loading={membersLoading}
                    loadingMoreMembers={membersLoadingMore}
                    members={members}
                    onClose={() => setSettingsOpen(false)}
                    onDelete={handleDeleteCommunity}
                    onLeave={handleLeaveCommunity}
                    onRemoveMember={handleRemoveMember}
                    onLoadMoreMembers={loadMoreMembers}
                    onRetry={refreshMembers}
                    onRoleChange={handleRoleChange}
                    onSave={handleCommunitySave}
                    open={settingsOpen}
                    role={role}
                />
            ) : null}
        </main>
    );
}
