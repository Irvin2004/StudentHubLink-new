export const ROUTES = Object.freeze({
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/app",
    COMMUNITIES: "/app/communities",
    COMMUNITY: "/community/:communityId",
    COMMUNITY_CHANNEL: "/community/:communityId/channel/:channelId",
    CHAT: "/app/chat",
    FILES: "/app/files",
    STUDY_PLANNER: "/app/study-planner",
    NOTIFICATIONS: "/app/notifications",
    SETTINGS: "/app/settings"
});

export const LEGACY_ROUTES = Object.freeze({
    UPLOAD: "/pages/upload.html",
    RESOURCES: "/pages/resources.html",
    MESSAGES: "/pages/messages.html",
    PROFILE: "/pages/profile.html"
});
