import { useMemo, useState } from "react";

import EmptyState from "../../../../components/EmptyState/EmptyState.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import Button from "../../../../components/ui/Button/Button.jsx";
import Card from "../../../../components/ui/Card/Card.jsx";
import {
    filterStudySessions,
    formatStudyMinutes,
    selectStudySubjects,
    sessionTimestamp
} from "../../utils/study-session-selectors.js";
import styles from "./StudyHistory.module.css";

function formatCompletedAt(value) {
    const timestamp = sessionTimestamp(value);
    if (!timestamp) return "Recently";
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(timestamp));
}

export function StudyHistory({ error, loading, sessions = [] }) {
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const subjects = useMemo(() => selectStudySubjects(sessions), [sessions]);
    const filteredSessions = useMemo(
        () =>
            filterStudySessions(sessions, {
                date: dateFilter,
                subject: subjectFilter
            }),
        [dateFilter, sessions, subjectFilter]
    );
    const filtersActive = subjectFilter !== "all" || Boolean(dateFilter);

    return (
        <Card as="section" className={styles.card}>
            <header className={styles.header}>
                <div>
                    <h2>Study History</h2>
                    <p>Your most recent completed sessions.</p>
                </div>
            </header>
            {!loading && !error && sessions.length ? (
                <div
                    className={styles.filters}
                    aria-label="Study history filters"
                >
                    <label>
                        <span>Subject</span>
                        <select
                            onChange={(event) =>
                                setSubjectFilter(event.target.value)
                            }
                            value={subjectFilter}
                        >
                            <option value="all">All subjects</option>
                            {subjects.map((subject) => (
                                <option key={subject} value={subject}>
                                    {subject}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>Date</span>
                        <input
                            onChange={(event) =>
                                setDateFilter(event.target.value)
                            }
                            type="date"
                            value={dateFilter}
                        />
                    </label>
                    {filtersActive ? (
                        <Button
                            onClick={() => {
                                setSubjectFilter("all");
                                setDateFilter("");
                            }}
                            variant="outline"
                        >
                            Clear Filters
                        </Button>
                    ) : null}
                </div>
            ) : null}
            {loading ? (
                <div className={styles.loading} aria-busy="true">
                    <Skeleton height="3.5rem" />
                    <Skeleton height="3.5rem" />
                    <Skeleton height="3.5rem" />
                </div>
            ) : error ? (
                <p className={styles.error} role="alert">
                    Study history could not be loaded.
                </p>
            ) : filteredSessions.length ? (
                <ol className={styles.list}>
                    {filteredSessions.slice(0, 10).map((session) => (
                        <li className={styles.item} key={session.id}>
                            <div>
                                <h3>{session.title}</h3>
                                <p>
                                    {session.subject} ·{" "}
                                    {formatCompletedAt(session.completedAt)}
                                </p>
                            </div>
                            <strong>
                                {formatStudyMinutes(session.actualMinutes)}
                            </strong>
                        </li>
                    ))}
                </ol>
            ) : sessions.length ? (
                <EmptyState
                    description="Try another subject or date."
                    title="No sessions match these filters"
                />
            ) : (
                <EmptyState
                    description="Finish a study session to start building your history."
                    title="No completed sessions yet"
                />
            )}
        </Card>
    );
}

export default StudyHistory;
