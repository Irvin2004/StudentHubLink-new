export const WEEKLY_GOAL_MINUTES = 5 * 60;
export const MINIMUM_SESSION_SECONDS = 60;

export function sessionTimestamp(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();

    const timestamp = new Date(value || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getWeekStart(now = new Date()) {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
    return start;
}

export function getWeekEnd(now = new Date()) {
    const end = getWeekStart(now);
    end.setDate(end.getDate() + 7);
    return end;
}

function completedSessionMinutes(session) {
    return Math.max(0, Number(session.actualMinutes) || 0);
}

export function isQualifyingStudySession(session) {
    const durationSeconds = Number(session?.durationSeconds);
    if (Number.isFinite(durationSeconds)) {
        return durationSeconds >= MINIMUM_SESSION_SECONDS;
    }

    return completedSessionMinutes(session) >= 1;
}

export function selectCurrentWeekSessions(sessions = [], now = new Date()) {
    const weekStart = getWeekStart(now).getTime();
    const weekEnd = getWeekEnd(now).getTime();

    return sessions.filter((session) => {
        const completedAt = sessionTimestamp(session.completedAt);
        return (
            isQualifyingStudySession(session) &&
            completedAt >= weekStart &&
            completedAt < weekEnd
        );
    });
}

export function selectWeeklyStudyMinutes(sessions = [], now = new Date()) {
    return selectCurrentWeekSessions(sessions, now).reduce(
        (total, session) => total + completedSessionMinutes(session),
        0
    );
}

export function selectWeeklyGoalProgress(
    sessions = [],
    now = new Date(),
    goalMinutes = WEEKLY_GOAL_MINUTES
) {
    if (!goalMinutes) return 0;
    return Math.min(
        100,
        Math.round(
            (selectWeeklyStudyMinutes(sessions, now) / goalMinutes) * 100
        )
    );
}

function dateKey(value) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function selectDailyStudyBreakdown(sessions = [], now = new Date()) {
    const start = getWeekStart(now);
    const weeklySessions = selectCurrentWeekSessions(sessions, now);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(date.getDate() + index);
        const key = dateKey(date);

        return {
            date: key,
            day: new Intl.DateTimeFormat(undefined, {
                weekday: "short"
            }).format(date),
            minutes: weeklySessions
                .filter(
                    (session) =>
                        dateKey(sessionTimestamp(session.completedAt)) === key
                )
                .reduce(
                    (total, session) =>
                        total + completedSessionMinutes(session),
                    0
                )
        };
    });
}

export function selectSubjectStudyBreakdown(sessions = [], now = new Date()) {
    const totals = new Map();
    selectCurrentWeekSessions(sessions, now).forEach((session) => {
        const subject =
            String(session.subject || "General").trim() || "General";
        totals.set(
            subject,
            (totals.get(subject) || 0) + completedSessionMinutes(session)
        );
    });

    return [...totals.entries()]
        .map(([subject, minutes]) => ({ minutes, subject }))
        .sort(
            (first, second) =>
                second.minutes - first.minutes ||
                first.subject.localeCompare(second.subject)
        );
}

export function selectAverageSessionMinutes(sessions = []) {
    const qualifyingSessions = sessions.filter(isQualifyingStudySession);
    if (!qualifyingSessions.length) return 0;
    const total = qualifyingSessions.reduce(
        (sum, session) => sum + completedSessionMinutes(session),
        0
    );
    return Math.round(total / qualifyingSessions.length);
}

export function selectLongestSessionMinutes(sessions = []) {
    return sessions
        .filter(isQualifyingStudySession)
        .reduce(
            (longest, session) =>
                Math.max(longest, completedSessionMinutes(session)),
            0
        );
}

export function selectStudySubjects(sessions = []) {
    return [
        ...new Set(
            sessions
                .map((session) => String(session.subject || "General").trim())
                .filter(Boolean)
        )
    ].sort((first, second) => first.localeCompare(second));
}

export function filterStudySessions(
    sessions = [],
    { date = "", subject = "all" } = {}
) {
    return sessions.filter((session) => {
        const matchesSubject =
            subject === "all" ||
            String(session.subject || "General").trim() === subject;
        const matchesDate =
            !date || dateKey(sessionTimestamp(session.completedAt)) === date;
        return matchesSubject && matchesDate;
    });
}

function daysBetween(first, second) {
    const [firstYear, firstMonth, firstDay] = first.split("-").map(Number);
    const [secondYear, secondMonth, secondDay] = second.split("-").map(Number);
    const firstDate = Date.UTC(firstYear, firstMonth - 1, firstDay);
    const secondDate = Date.UTC(secondYear, secondMonth - 1, secondDay);
    return Math.round((secondDate - firstDate) / 86_400_000);
}

export function selectStudyStreak(sessions = [], now = new Date()) {
    const days = [
        ...new Set(
            sessions
                .filter(isQualifyingStudySession)
                .map((session) => sessionTimestamp(session.completedAt))
                .filter(Boolean)
                .map(dateKey)
        )
    ].sort();
    if (!days.length) return { current: 0, longest: 0, progress: 0 };

    let longest = 1;
    let run = 1;
    for (let index = 1; index < days.length; index += 1) {
        run = daysBetween(days[index - 1], days[index]) === 1 ? run + 1 : 1;
        longest = Math.max(longest, run);
    }

    const today = dateKey(now);
    const latest = days.at(-1);
    const daysSinceLatest = daysBetween(latest, today);
    const active = daysSinceLatest >= 0 && daysSinceLatest <= 1;
    let current = active ? 1 : 0;
    for (let index = days.length - 1; active && index > 0; index -= 1) {
        if (daysBetween(days[index - 1], days[index]) !== 1) break;
        current += 1;
    }

    return {
        current,
        longest,
        progress: Math.min(100, Math.round((current / 7) * 100))
    };
}

export function selectStudyAnalytics(
    sessions = [],
    now = new Date(),
    weeklyGoalMinutes = WEEKLY_GOAL_MINUTES
) {
    const weeklyMinutes = selectWeeklyStudyMinutes(sessions, now);

    return {
        averageSessionMinutes: selectAverageSessionMinutes(sessions),
        dailyBreakdown: selectDailyStudyBreakdown(sessions, now),
        longestSessionMinutes: selectLongestSessionMinutes(sessions),
        streak: selectStudyStreak(sessions, now),
        subjectBreakdown: selectSubjectStudyBreakdown(sessions, now),
        weeklyGoalMinutes,
        weeklyMinutes,
        weeklyProgress: selectWeeklyGoalProgress(
            sessions,
            now,
            weeklyGoalMinutes
        )
    };
}

export function formatSessionTimer(totalSeconds = 0) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const remainder = String(seconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${remainder}`;
}

export function formatStudyMinutes(minutes = 0) {
    const value = Math.max(0, Math.round(minutes));
    const hours = Math.floor(value / 60);
    const remainder = value % 60;
    if (!hours) return `${remainder}m`;
    if (!remainder) return `${hours}h`;
    return `${hours}h ${remainder}m`;
}

export function secondsToStudyMinutes(seconds = 0) {
    if (seconds <= 0) return 0;
    return Math.max(1, Math.round(seconds / 60));
}
