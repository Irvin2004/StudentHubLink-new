import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button/index.js";
import Modal from "../../components/ui/Modal/index.js";
import CommunityCardSkeleton from "../../components/Skeleton/CommunityCardSkeleton.jsx";
import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import CommunityGrid from "../../components/communities/CommunityGrid/index.js";
import CommunityHeader from "../../components/communities/CommunityHeader/index.js";
import CommunityMembers from "../../components/communities/CommunityMembers/index.js";
import CommunitySearch from "../../components/communities/CommunitySearch/index.js";
import CreateCommunityModal from "../../components/communities/CreateCommunityModal/index.js";
import JoinCommunityButton from "../../components/communities/JoinCommunityButton/index.js";
import LeaveCommunityButton from "../../components/communities/LeaveCommunityButton/index.js";
import { isCommunityOwner } from "../../config/community-permissions.js";
import { COMMUNITY_ROLES } from "../../config/community-roles.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useCommunities } from "../../hooks/useCommunities.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useNetwork } from "../../hooks/useNetwork.js";
import { useObservability } from "../../hooks/useObservability.js";
import { useToast } from "../../hooks/useToast.js";
import { normalizeCommunityText } from "../../utils/community-validation.js";
import styles from "./CommunitiesPage.module.css";

function AddIcon() {
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

export default function CommunitiesPage() {
    useDocumentTitle("StudentHub - Communities", "react-app");

    const navigate = useNavigate();
    const { user } = useAuth();
    const { isOnline } = useNetwork();
    const { showToast } = useToast();
    const { captureError, getActionableErrorMessage } = useObservability();
    const {
        communities,
        createCommunity,
        error,
        joinedCommunityIds,
        joinCommunity,
        leaveCommunity,
        loading,
        refreshCommunities
    } = useCommunities();
    const [searchTerm, setSearchTerm] = useState("");
    const [category, setCategory] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [pendingMemberships, setPendingMemberships] = useState(
        () => new Map()
    );
    const reportedError = useRef(null);

    useEffect(() => {
        if (!error || reportedError.current === error) return;

        reportedError.current = error;
        showToast({
            title: "Communities unavailable",
            message: getActionableErrorMessage(error, "community"),
            type: "error"
        });
    }, [error, getActionableErrorMessage, showToast]);

    const handleSearch = useCallback((value) => setSearchTerm(value), []);

    const filteredCommunities = useMemo(() => {
        const normalizedSearch = normalizeCommunityText(searchTerm);

        return communities.filter((community) => {
            const matchesCategory =
                !category || community.category === category;
            const searchableText = normalizeCommunityText(
                `${community.name} ${community.description} ${community.category}`
            );

            return (
                matchesCategory &&
                (!normalizedSearch || searchableText.includes(normalizedSearch))
            );
        });
    }, [category, communities, searchTerm]);

    function isOwner(community) {
        return isCommunityOwner(user, community);
    }

    function isJoined(community) {
        return isOwner(community) || joinedCommunityIds.has(community.id);
    }

    function reportActionError(action, actionError) {
        captureError(actionError, {
            feature: action.toLowerCase().replaceAll(" ", "_")
        });
        showToast({
            title: `${action} failed`,
            message: getActionableErrorMessage(actionError, "community"),
            type: "error"
        });
    }

    function setPendingMembership(communityId, action) {
        setPendingMemberships((current) => {
            const next = new Map(current);
            if (action) next.set(communityId, action);
            else next.delete(communityId);
            return next;
        });
    }

    async function handleJoin(community) {
        setPendingMembership(community.id, "join");

        try {
            const membership = await joinCommunity(community.id);
            showToast({
                title: "Community joined",
                message: `You joined ${community.name}.`,
                type: "success"
            });
            return membership;
        } catch (actionError) {
            reportActionError("Join", actionError);
            throw actionError;
        } finally {
            setPendingMembership(community.id, null);
        }
    }

    async function handleLeave(community) {
        setPendingMembership(community.id, "leave");

        try {
            await leaveCommunity(community.id);
            showToast({
                title: "Community left",
                message: `You left ${community.name}.`,
                type: "info"
            });
        } catch (actionError) {
            reportActionError("Leave", actionError);
            throw actionError;
        } finally {
            setPendingMembership(community.id, null);
        }
    }

    function renderMembershipAction(community) {
        if (isOwner(community)) {
            return <span className={styles.ownerLabel}>Owner</span>;
        }

        const pendingAction = pendingMemberships.get(community.id);

        if (pendingAction) {
            return (
                <Button
                    loading
                    loadingLabel={
                        pendingAction === "join" ? "Joining" : "Leaving"
                    }
                    variant={pendingAction === "join" ? "outline" : "danger"}
                >
                    {pendingAction === "join" ? "Join" : "Leave"}
                </Button>
            );
        }

        return isJoined(community) ? (
            <LeaveCommunityButton
                communityName={community.name}
                onLeave={() => handleLeave(community)}
            />
        ) : (
            <JoinCommunityButton
                communityName={community.name}
                onJoin={() => handleJoin(community)}
            />
        );
    }

    async function handleCreate(input) {
        try {
            const community = await createCommunity(input);

            showToast({
                title: "Community created",
                message: `${community.name} is ready.`,
                type: "success"
            });
            return community;
        } catch (createError) {
            reportActionError("Create community", createError);
            throw createError;
        }
    }

    function handleRetry() {
        void refreshCommunities().catch(() => {});
    }

    async function handleShare() {
        const shareUrl = `${window.location.origin}/app/communities?community=${selectedCommunity.id}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast({
                title: "Link copied",
                message: "The community link is ready to share.",
                type: "success"
            });
        } catch {
            showToast({
                title: "Share link",
                message: shareUrl,
                type: "info",
                duration: 7000
            });
        }
    }

    const selectedMembers = selectedCommunity
        ? [
              {
                  userId: selectedCommunity.ownerId,
                  displayName: "Community owner",
                  role: COMMUNITY_ROLES.OWNER
              }
          ]
        : [];

    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Communities</h1>
                    <p>Find your people, share ideas, and learn together.</p>
                </div>
                <Button
                    disabled={!isOnline}
                    icon={<AddIcon />}
                    onClick={() => setCreateOpen(true)}
                >
                    Create community
                </Button>
            </header>

            <CommunitySearch
                category={category}
                onCategoryChange={setCategory}
                onSearch={handleSearch}
            />

            {loading ? (
                <CommunityCardSkeleton />
            ) : error && !communities.length ? (
                <LoadErrorState
                    description="We could not load the community list."
                    onRetry={handleRetry}
                    title="Communities unavailable"
                />
            ) : (
                <CommunityGrid
                    communities={filteredCommunities}
                    createAction={{
                        label: "Create community",
                        onClick: () => setCreateOpen(true)
                    }}
                    getAction={renderMembershipAction}
                    onOpenCommunity={(community) =>
                        navigate(`/community/${community.id}/channel/general`)
                    }
                />
            )}

            {!loading && error && communities.length ? (
                <div className={styles.retry}>
                    <p role="status">
                        Showing saved results because the latest refresh failed.
                    </p>
                    <Button onClick={handleRetry} variant="outline">
                        Try again
                    </Button>
                </div>
            ) : null}

            <CreateCommunityModal
                disabled={!isOnline}
                onClose={() => setCreateOpen(false)}
                onCreate={handleCreate}
                open={createOpen}
            />

            <Modal
                onClose={() => setSelectedCommunity(null)}
                open={Boolean(selectedCommunity)}
                size="wide"
                title="Community details"
            >
                {selectedCommunity ? (
                    <div className={styles.details}>
                        <CommunityHeader
                            action={renderMembershipAction(selectedCommunity)}
                            community={selectedCommunity}
                            onShare={handleShare}
                        />
                        <CommunityMembers members={selectedMembers} />
                    </div>
                ) : null}
            </Modal>
        </main>
    );
}
