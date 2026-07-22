import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
