import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button/index.js";
import Modal from "../../components/ui/Modal/index.js";
import Skeleton from "../../components/ui/Skeleton/index.js";
import CommunityGrid from "../../components/communities/CommunityGrid/index.js";
import CommunityHeader from "../../components/communities/CommunityHeader/index.js";
import CommunityMembers from "../../components/communities/CommunityMembers/index.js";
import CommunitySearch from "../../components/communities/CommunitySearch/index.js";
import CreateCommunityModal from "../../components/communities/CreateCommunityModal/index.js";
import JoinCommunityButton from "../../components/communities/JoinCommunityButton/index.js";
import LeaveCommunityButton from "../../components/communities/LeaveCommunityButton/index.js";
import { COMMUNITY_ROLES } from "../../config/community-roles.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useCommunities } from "../../hooks/useCommunities.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
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

function CommunityGridSkeleton() {
    return (
        <section
            aria-busy="true"
            aria-label="Loading communities"
            className={styles.skeletonGrid}
        >
            {Array.from({ length: 6 }, (_, index) => (
                <div className={styles.skeletonCard} key={index}>
                    <Skeleton height="9rem" variant="rectangle" />
                    <div>
                        <Skeleton height="1.5rem" width="70%" />
                        <Skeleton count={2} />
                        <Skeleton height="2.75rem" width="5rem" />
                    </div>
                </div>
            ))}
        </section>
    );
}

export default function CommunitiesPage() {
    useDocumentTitle("StudentHub - Communities", "react-app");

    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { communities, createCommunity, error, loading, refreshCommunities } =
        useCommunities();
    const [searchTerm, setSearchTerm] = useState("");
    const [category, setCategory] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [joinedIds, setJoinedIds] = useState(() => new Set());
    const reportedError = useRef(null);

    useEffect(() => {
        if (!error || reportedError.current === error) return;

        reportedError.current = error;
        showToast({
            title: "Communities unavailable",
            message: error.message || "Please try again.",
            type: "error"
        });
    }, [error, showToast]);

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
        return community.ownerId === user?.uid;
    }

    function isJoined(community) {
        return isOwner(community) || joinedIds.has(community.id);
    }

    function reportActionError(action, actionError) {
        showToast({
            title: `${action} failed`,
            message: actionError.message || "Please try again.",
            type: "error"
        });
    }

    function handleJoined(community) {
        setJoinedIds((current) => new Set(current).add(community.id));
        showToast({
            title: "Community joined",
            message: `You joined ${community.name}.`,
            type: "success"
        });
    }

    function handleLeft(community) {
        setJoinedIds((current) => {
            const next = new Set(current);
            next.delete(community.id);
            return next;
        });
        showToast({
            title: "Community left",
            message: `You left ${community.name}.`,
            type: "info"
        });
    }

    function renderMembershipAction(community) {
        if (isOwner(community)) {
            return <span className={styles.ownerLabel}>Owner</span>;
        }

        return isJoined(community) ? (
            <LeaveCommunityButton
                communityId={community.id}
                communityName={community.name}
                onError={(actionError) =>
                    reportActionError("Leave", actionError)
                }
                onLeft={() => handleLeft(community)}
            />
        ) : (
            <JoinCommunityButton
                communityId={community.id}
                communityName={community.name}
                onError={(actionError) =>
                    reportActionError("Join", actionError)
                }
                onJoined={() => handleJoined(community)}
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
                <Button icon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                    Create community
                </Button>
            </header>

            <CommunitySearch
                category={category}
                onCategoryChange={setCategory}
                onSearch={handleSearch}
            />

            {loading ? (
                <CommunityGridSkeleton />
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

            {!loading && error ? (
                <div className={styles.retry}>
                    <p>We could not refresh the community list.</p>
                    <Button
                        onClick={() => void refreshCommunities()}
                        variant="outline"
                    >
                        Try again
                    </Button>
                </div>
            ) : null}

            <CreateCommunityModal
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
