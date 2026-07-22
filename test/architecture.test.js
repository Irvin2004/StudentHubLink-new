import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDashboardRefreshManager } from
    "../js/controllers/dashboard-refresh.js";
import { renderDashboard } from
    "../js/renderers/dashboard-renderer.js";

const read = (path) => readFileSync(path, "utf8");

test("notification service and rules use the same nested path", () => {
    assert.match(read("js/services/notification-service.js"), /COLLECTIONS\.USERS/);
    assert.match(read("firestore.rules"), /users\/\{userId\}\/notifications/);
});

test("message deep links include conversation and message context", () => {
    assert.match(read("js/events/message-events.js"), /conversationId: cleanChatId/);
    assert.match(read("js/controllers/notification-controller.js"), /&message=/);
});

test("message transactions import runTransaction", () => {
    const source = read("js/services/message-service.js");
    assert.match(source.slice(0, source.indexOf("from \"https://")), /runTransaction/);
});

test("custom dialogs use the shared focus trap", () => {
    assert.match(read("js/components/image-viewer.js"), /activateFocusTrap/);
    assert.match(read("js/components/delete-message-dialog.js"), /activateFocusTrap/);
});

test("dashboard listeners stay behind service boundaries", () => {
    const controller = read("js/controllers/dashboard-controller.js");

    assert.doesNotMatch(controller, /onSnapshot/);
    assert.match(controller, /subscribeToAssignments/);
    assert.match(controller, /subscribeToNotifications/);
    assert.match(controller, /subscribeToUserConversations/);
    assert.match(controller, /subscribeToUserStudyGroups/);
    assert.match(read("js/services/assignment-service.js"), /onSnapshot/);
    assert.match(read("js/services/group-service.js"), /onSnapshot/);
});

test("dashboard refresh manager updates only affected widgets", () => {
    const elements = {
        stats: { innerHTML: "" },
        assignments: { innerHTML: "" },
        notifications: { innerHTML: "" },
        groups: { innerHTML: "" }
    };
    const data = {
        stats: {
            groups: 1,
            friends: 2,
            assignments: 0,
            unreadNotifications: 0,
            unreadMessages: 0
        },
        assignments: [],
        notifications: [],
        groups: [{ id: "g1", name: "Robotics", memberCount: 4 }],
        conversations: []
    };

    renderDashboard(data, elements);
    const notificationsBefore = elements.notifications.innerHTML;
    const groupsBefore = elements.groups.innerHTML;
    const manager = createDashboardRefreshManager({
        data,
        elements,
        userId: "user-1"
    });

    manager.refreshAssignments([{
        id: "a1",
        groupId: "g1",
        title: "Practical",
        dueDate: new Date(Date.now() + 86_400_000).toISOString()
    }]);

    assert.match(elements.assignments.innerHTML, /Practical/);
    assert.match(elements.stats.innerHTML, /Assignments: 1/);
    assert.equal(elements.notifications.innerHTML, notificationsBefore);
    assert.equal(elements.groups.innerHTML, groupsBefore);

    manager.refreshConversations([{
        unreadCounts: { "user-1": 3 }
    }]);
    assert.match(elements.stats.innerHTML, /Messages: 3/);
});

test("activity service and rules use the group-scoped path", () => {
    const service = read("js/services/activity-service.js");
    const rules = read("firestore.rules");

    assert.match(
        service,
        /collection\(\s*db,\s*"groups",\s*groupId,\s*"activities"/s
    );
    assert.match(
        service,
        /orderBy\("createdAt",\s*"desc"\)/
    );
    assert.match(service, /onSnapshot/);
    assert.match(service, /createActivityModel/);
    assert.match(service, /serverTimestamp\(\)/);
    assert.doesNotMatch(service, /ACTIVITY_COLLECTION/);
    assert.match(
        rules,
        /match \/groups\/\{groupId\}[\s\S]*match \/activities\/\{activityId\}/
    );
    assert.doesNotMatch(
        rules,
        /^\s{4}match \/activities\/\{activityId\}/m
    );
});

test("activity controller coordinates service and renderer boundaries", () => {
    const controller = read("js/controllers/activity-controller.js");
    const dashboard = read("js/controllers/dashboard-controller.js");

    assert.match(controller, /getGroupActivities/);
    assert.match(controller, /subscribeToGroupActivities/);
    assert.match(controller, /renderActivityLoading/);
    assert.match(controller, /renderActivityFeed/);
    assert.match(controller, /renderActivityError/);
    assert.doesNotMatch(controller, /onSnapshot|firebase-firestore|innerHTML\s*=/);
    assert.match(controller, /destroy\(\)/);
    assert.match(dashboard, /initializeActivityFeed/);
    assert.doesNotMatch(dashboard, /getGroupActivities|subscribeToGroupActivities/);
});

test("presence service uses user-scoped status documents", () => {
    const service = read("js/services/presence-service.js");
    const rules = read("firestore.rules");

    assert.match(
        service,
        /COLLECTIONS\.USERS,[\s\S]*userId,[\s\S]*COLLECTIONS\.PRESENCE,[\s\S]*"status"/
    );
    assert.match(service, /PRESENCE_STATUS\.ONLINE/);
    assert.match(service, /PRESENCE_STATUS\.OFFLINE/);
    assert.match(service, /PRESENCE_STATUS\.TYPING/);
    assert.match(service, /const TYPING_TIMEOUT = 2000/);
    assert.match(service, /subscribeToPresence/);
    assert.doesNotMatch(service, /document\.|window\.|innerHTML/);
    assert.match(
        rules,
        /match \/users\/\{userId\}\/presence\/\{presenceId\}/
    );
    assert.doesNotMatch(
        rules,
        /match \/presence\/\{legacyPresenceId\}[\s\S]*allow create, update: if/
    );
    assert.doesNotMatch(rules, /^\s{4}match \/typingStatus\/\{typingId\}/m);
});

test("presence renderer stays reusable and passive", () => {
    const renderer = read("js/renderers/presence-renderer.js");
    const styles = read("css/components/presence.css");

    assert.match(renderer, /export function renderPresence\(/);
    assert.match(renderer, /export function renderPresenceBadge\(/);
    assert.match(renderer, /export function renderTypingIndicator\(/);
    assert.match(renderer, /export function clearPresence\(/);
    assert.match(renderer, /currentConversationId/);
    assert.match(renderer, /aria-live="polite"/);
    assert.doesNotMatch(
        renderer,
        /firebase|firestore|onSnapshot|addEventListener/
    );
    assert.match(styles, /@keyframes presence-typing-dot/);
    assert.match(styles, /prefers-reduced-motion/);
});
