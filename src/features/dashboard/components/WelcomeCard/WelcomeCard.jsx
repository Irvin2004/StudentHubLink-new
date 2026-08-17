/* eslint-disable react-refresh/only-export-components -- deterministic welcome helpers are exported for focused tests. */
import { useEffect, useMemo, useState } from "react";

import Avatar from "../../../../components/ui/Avatar/Avatar.jsx";
import Button from "../../../../components/ui/Button/Button.jsx";
import Skeleton from "../../../../components/Skeleton/Skeleton.jsx";
import styles from "./WelcomeCard.module.css";

const MESSAGES = [
    "Every study session brings you closer to your goals.",
    "Consistency beats perfection.",
    "Today's effort is tomorrow's success.",
    "Keep learning. Keep growing.",
    "One chapter at a time."
];

const GREETINGS = [
    { label: "Good Morning", icon: "🌅", from: 5, to: 11 },
    { label: "Good Afternoon", icon: "☀️", from: 12, to: 16 },
    { label: "Good Evening", icon: "🌆", from: 17, to: 21 },
    { label: "Good Night", icon: "🌙", from: 22, to: 4 }
];

function getDateKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function getGreetingForTime(date = new Date()) {
    const hour = date.getHours();

    return (
        GREETINGS.find(({ from, to }) =>
            from <= to ? hour >= from && hour <= to : hour >= from || hour <= to
        ) || GREETINGS[2]
    );
}

function getSeedValue(seed = "") {
    return String(seed || "studenthub")
        .split("")
        .reduce((total, character) => total + character.charCodeAt(0), 0);
}

export function getDailyMotivation(seed = "", date = new Date()) {
    const storageKey = "studenthub.welcome-message";
    const dayKey = getDateKey(date);
    const cacheSeed = String(seed || "studenthub");
    const seedValue = getSeedValue(seed);

    try {
        const cached = JSON.parse(
            window.localStorage.getItem(storageKey) || "null"
        );

        if (
            cached?.dayKey === dayKey &&
            cached?.seed === cacheSeed &&
            typeof cached.index === "number"
        ) {
            return MESSAGES[cached.index % MESSAGES.length];
        }
    } catch {
        // Ignore storage parsing failures and fall back to a deterministic pick.
    }

    const index =
        (seedValue +
            dayKey
                .split("")
                .reduce(
                    (total, character) => total + character.charCodeAt(0),
                    0
                )) %
        MESSAGES.length;

    try {
        window.localStorage.setItem(
            storageKey,
            JSON.stringify({ dayKey, index, seed: cacheSeed })
        );
    } catch {
        // Ignore storage write failures.
    }

    return MESSAGES[index];
}

export function getDisplayName(user, greeting) {
    return user?.displayName?.trim() || greeting?.name?.trim() || "StudentHub";
}

export function WelcomeCard({
    greeting,
    loading,
    onCompleteProfile,
    onContinueLearning,
    studyStreak = 0,
    user
}) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(timer);
    }, []);

    const displayName = getDisplayName(user, greeting);
    const timeGreeting = getGreetingForTime(now);
    const motivation = useMemo(
        () => getDailyMotivation(user?.uid || displayName, now),
        [displayName, now, user?.uid]
    );
    const streakCount = Math.max(0, Number(studyStreak) || 0);
    const avatarName = displayName || "StudentHub";

    if (loading) {
        return (
            <section className={styles.card} aria-busy="true">
                <div className={styles.loading}>
                    <Skeleton
                        borderRadius="999px"
                        className={styles.loadingAvatar}
                        variant="circle"
                    />
                    <div className={styles.loadingCopy}>
                        <Skeleton width="18rem" />
                        <Skeleton width="12rem" />
                        <Skeleton width="22rem" />
                    </div>
                </div>
            </section>
        );
    }

    if (!user) {
        return (
            <section className={styles.card}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyCopy}>
                        <h1 className={styles.emptyTitle}>
                            Welcome to StudentHub 👋
                        </h1>
                        <p className={styles.emptyMessage}>
                            Complete your profile to personalise your dashboard.
                        </p>
                    </div>
                    <Button
                        className={styles.primaryAction}
                        onClick={onCompleteProfile}
                        type="button"
                    >
                        Complete Profile
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.card}>
            <div className={styles.content}>
                <div className={styles.headerRow}>
                    <h1 className={styles.greeting}>
                        <span className={styles.greetingEmoji}>
                            {timeGreeting.icon}
                        </span>
                        <span>
                            {timeGreeting.label}, {avatarName}
                        </span>
                    </h1>
                    <Avatar
                        className={styles.avatar}
                        name={avatarName}
                        size="large"
                        src={user?.photoURL || greeting?.photoURL || null}
                    />
                </div>

                <p className={styles.backText}>Welcome back to StudentHub</p>

                <p className={styles.motivation}>
                    <span aria-hidden="true">📚</span>
                    <span>{motivation}</span>
                </p>

                <p className={styles.streak}>
                    <span aria-hidden="true">🔥</span>
                    <span>Study Streak: {streakCount} Days</span>
                </p>

                <Button
                    className={styles.primaryAction}
                    onClick={onContinueLearning}
                    type="button"
                >
                    Continue Learning
                </Button>
            </div>
        </section>
    );
}
