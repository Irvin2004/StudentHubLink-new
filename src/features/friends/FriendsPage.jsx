import { useState } from "react";

import { LoadErrorState } from "../../components/common/LoadErrorState.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import Avatar from "../../components/ui/Avatar/index.js";
import Button from "../../components/ui/Button/index.js";
import Input from "../../components/ui/Input/index.js";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useFriends } from "./hooks/useFriends.js";
import styles from "./FriendsPage.module.css";

function PersonCard({ actions, person, subtitle }) {
    return (
        <article className={styles.personCard}>
            <Avatar name={person.displayName} src={person.photoURL} />
            <div className={styles.personCopy}>
                <h3>{person.displayName}</h3>
                <p>{subtitle || person.email || "StudentHub student"}</p>
            </div>
            <div className={styles.actions}>{actions}</div>
        </article>
    );
}

function LoadingList() {
    return (
        <div aria-label="Loading connections" className={styles.list}>
            {[1, 2, 3].map((item) => (
                <div className={styles.loadingCard} key={item}>
                    <Skeleton height="3rem" variant="circle" width="3rem" />
                    <Skeleton width="55%" />
                    <Skeleton height="2.5rem" width="7rem" />
                </div>
            ))}
        </div>
    );
}

export default function FriendsPage() {
    useDocumentTitle("StudentHub - Friends", "react-app");
    const friends = useFriends();
    const initialTab =
        new URLSearchParams(window.location.search).get("tab") === "requests"
            ? "requests"
            : "friends";
    const [tab, setTab] = useState(initialTab);
    const [searchTerm, setSearchTerm] = useState("");
    const requestCount = friends.incoming.length;

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Your study network</p>
                    <h1>Friends &amp; Connections</h1>
                    <p>
                        Find classmates, manage requests, and keep your learning
                        circle close.
                    </p>
                </div>
                <div className={styles.summary}>
                    <strong>{friends.friends.length}</strong>
                    <span>
                        {friends.friends.length === 1 ? "friend" : "friends"}
                    </span>
                </div>
            </header>

            <nav aria-label="Connections sections" className={styles.tabs}>
                {[
                    ["friends", "Friends"],
                    [
                        "requests",
                        `Requests${requestCount ? ` (${requestCount})` : ""}`
                    ],
                    ["find", "Find People"]
                ].map(([id, label]) => (
                    <button
                        aria-pressed={tab === id}
                        key={id}
                        onClick={() => setTab(id)}
                        type="button"
                    >
                        {label}
                    </button>
                ))}
            </nav>

            {friends.loading ? (
                <LoadingList />
            ) : friends.error ? (
                <LoadErrorState
                    description="We could not load your friends and requests."
                    onRetry={friends.reload}
                    title="Connections unavailable"
                />
            ) : tab === "friends" ? (
                friends.friends.length ? (
                    <section aria-label="Friends list" className={styles.list}>
                        {friends.friends.map((friend) => (
                            <PersonCard
                                actions={
                                    <Button
                                        disabled={friends.pending.includes(
                                            friend.id
                                        )}
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    `Remove ${friend.person.displayName} from your friends?`
                                                )
                                            ) {
                                                void friends.remove(friend);
                                            }
                                        }}
                                        size="small"
                                        variant="danger"
                                    >
                                        Remove
                                    </Button>
                                }
                                key={friend.id}
                                person={friend.person}
                                subtitle="Friend"
                            />
                        ))}
                    </section>
                ) : (
                    <EmptyState
                        actionLabel="Find People"
                        description="Search for classmates and send your first friend request."
                        icon="👋"
                        onAction={() => setTab("find")}
                        title="Build your study circle"
                    />
                )
            ) : tab === "requests" ? (
                <div className={styles.requestGroups}>
                    <section aria-labelledby="incoming-requests-title">
                        <h2 id="incoming-requests-title">Incoming requests</h2>
                        {friends.incoming.length ? (
                            <div className={styles.list}>
                                {friends.incoming.map((request) => (
                                    <PersonCard
                                        actions={
                                            <>
                                                <Button
                                                    disabled={friends.pending.includes(
                                                        request.id
                                                    )}
                                                    onClick={() =>
                                                        void friends.accept(
                                                            request
                                                        )
                                                    }
                                                    size="small"
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    disabled={friends.pending.includes(
                                                        request.id
                                                    )}
                                                    onClick={() =>
                                                        void friends.decline(
                                                            request
                                                        )
                                                    }
                                                    size="small"
                                                    variant="secondary"
                                                >
                                                    Decline
                                                </Button>
                                            </>
                                        }
                                        key={request.id}
                                        person={request.person}
                                        subtitle="Wants to connect with you"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className={styles.inlineEmpty}>
                                No incoming friend requests.
                            </p>
                        )}
                    </section>
                    <section aria-labelledby="outgoing-requests-title">
                        <h2 id="outgoing-requests-title">Sent requests</h2>
                        {friends.outgoing.length ? (
                            <div className={styles.list}>
                                {friends.outgoing.map((request) => (
                                    <PersonCard
                                        actions={
                                            <Button
                                                disabled={friends.pending.includes(
                                                    request.id
                                                )}
                                                onClick={() =>
                                                    void friends.cancel(request)
                                                }
                                                size="small"
                                                variant="secondary"
                                            >
                                                Cancel request
                                            </Button>
                                        }
                                        key={request.id}
                                        person={request.person}
                                        subtitle="Request pending"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className={styles.inlineEmpty}>
                                No outgoing friend requests.
                            </p>
                        )}
                    </section>
                </div>
            ) : (
                <section
                    aria-labelledby="find-people-title"
                    className={styles.find}
                >
                    <div>
                        <h2 id="find-people-title">Find people</h2>
                        <p>Search by display name or exact email address.</p>
                    </div>
                    <form
                        className={styles.searchForm}
                        onSubmit={(event) => {
                            event.preventDefault();
                            void friends.search(searchTerm);
                        }}
                    >
                        <Input
                            label="Student name or email"
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="e.g. Alex or alex@example.com"
                            type="search"
                            value={searchTerm}
                        />
                        <Button
                            disabled={searchTerm.trim().length < 2}
                            loading={friends.searching}
                            loadingLabel="Searching"
                            type="submit"
                        >
                            Search
                        </Button>
                    </form>
                    {friends.searchError ? (
                        <LoadErrorState
                            description="We could not search for students."
                            onRetry={() => friends.search(searchTerm)}
                            title="Search unavailable"
                        />
                    ) : friends.results.length ? (
                        <div
                            aria-label="People search results"
                            className={styles.list}
                        >
                            {friends.results.map((person) => {
                                const relation = friends.relationByUserId.get(
                                    person.id
                                );
                                return (
                                    <PersonCard
                                        actions={
                                            relation ? (
                                                <span className={styles.status}>
                                                    {relation.type === "friend"
                                                        ? "Friends"
                                                        : relation.type ===
                                                            "incoming"
                                                          ? "Request received"
                                                          : "Request sent"}
                                                </span>
                                            ) : (
                                                <Button
                                                    disabled={friends.pending.includes(
                                                        person.id
                                                    )}
                                                    onClick={() =>
                                                        void friends.send(
                                                            person
                                                        )
                                                    }
                                                    size="small"
                                                >
                                                    Add Friend
                                                </Button>
                                            )
                                        }
                                        key={person.id}
                                        person={person}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <p className={styles.inlineEmpty}>
                            {searchTerm
                                ? "No students found yet. Try another name or email."
                                : "Search results will appear here."}
                        </p>
                    )}
                </section>
            )}
        </main>
    );
}
