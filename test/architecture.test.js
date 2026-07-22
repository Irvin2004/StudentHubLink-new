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
