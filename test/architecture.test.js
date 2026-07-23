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

test("message reactions no longer mutate embedded message maps", () => {
    const source = read("js/services/message-service.js");
    assert.doesNotMatch(
        source,
        /transaction\.update\([\s\S]{0,120}\{ reactions \}/
    );
});

test("message reactions use user-keyed nested documents", () => {
    const service = read("js/services/message-service.js");
    const rules = read("firestore.rules");

    assert.match(service, /function getReactionsCollection\(/);
    assert.match(service, /export async function addReaction\(/);
    assert.match(service, /export async function removeReaction\(/);
    assert.match(service, /export async function getMessageReactions\(/);
    assert.match(service, /export function subscribeToReactions\(/);
    assert.match(service, /createReactionModel/);
    assert.match(
        rules,
        /conversations\/\{conversationId\}\/messages\/\{messageId\}\/reactions\/\{userId\}/
    );
    assert.doesNotMatch(
        rules,
        /affectedKeys\(\)[\s\S]{0,80}hasOnly\(\["reactions"\]\)/
    );
    assert.doesNotMatch(service, /document\.|window\.|innerHTML/);
});

test("message read receipts use user-keyed nested documents", () => {
    const service = read("js/services/message-service.js");
    const rules = read("firestore.rules");

    assert.match(service, /function getReadReceiptsCollection\(/);
    assert.match(service, /export async function markMessageDelivered\(/);
    assert.match(service, /export async function markMessageRead\(/);
    assert.match(service, /export async function getReadReceipts\(/);
    assert.match(service, /export function subscribeToReadReceipts\(/);
    assert.match(service, /createReadReceiptModel/);
    assert.match(service, /MESSAGE_STATUS\.DELIVERED/);
    assert.match(service, /MESSAGE_STATUS\.READ/);
    assert.match(
        rules,
        /conversations\/\{conversationId\}\/messages\/\{messageId\}\/readReceipts\/\{userId\}/
    );
    assert.match(rules, /function receiptTransitionIsValid\(\)/);
    assert.doesNotMatch(service, /document\.|window\.|innerHTML/);
});

test("voice recording stays browser-only and message types are centralized", () => {
    const recorder = read("js/components/voice-recorder.js");
    const model = read("js/models/message.js");
    const service = read("js/services/message-service.js");

    assert.match(recorder, /export function createVoiceRecorder\(/);
    assert.match(recorder, /export function startRecording\(/);
    assert.match(recorder, /export function stopRecording\(/);
    assert.match(recorder, /export function cancelRecording\(/);
    assert.match(recorder, /export function destroy\(/);
    assert.match(recorder, /getUserMedia/);
    assert.match(recorder, /MediaRecorderClass/);
    assert.doesNotMatch(
        recorder,
        /firebase|firestore|upload|sendMessage|innerHTML|createElement/
    );
    assert.match(model, /createMessageModel/);
    assert.match(model, /MESSAGE_TYPES\.VOICE/);
    assert.match(service, /config\/message-types\.js/);
});

test("voice messages upload before Firestore writes and remain deletable", () => {
    const storage = read("js/services/storage-service.js");
    const messages = read("js/services/message-service.js");
    const voiceRenderer = read("js/renderers/voice-message-renderer.js");
    const storageRules = read("storage.rules");
    const firestoreRules = read("firestore.rules");

    assert.match(storage, /export async function uploadVoiceMessage\(/);
    assert.match(storage, /export async function deleteVoiceMessage\(/);
    assert.match(storage, /downloadURL/);
    assert.match(storage, /storagePath/);
    assert.match(storage, /deleteObject/);
    assert.doesNotMatch(storage, /firestore|sendMessage/);
    assert.match(messages, /export async function sendVoiceMessage\(/);
    assert.ok(
        messages.indexOf("await uploadVoiceMessage(") <
        messages.indexOf("return await sendMessage({")
    );
    assert.match(messages, /voice: voiceMessage\.voice/);
    assert.match(messages, /await deleteVoiceMessage\(uploaded\.storagePath\)/);
    assert.doesNotMatch(messages, /voice:\s*\{[^}]*blob/s);
    assert.match(voiceRenderer, /voice\.url \|\| message\?\.fileUrl/);
    assert.match(storageRules, /match \/voice\/\{conversationId\}\/\{userId\}/);
    assert.match(storageRules, /request\.auth\.uid == userId/);
    assert.match(firestoreRules, /"mimeType", "voice"/);
});

test("voice player uses one shared audio element and remains service-free", () => {
    const player = read("js/components/voice-player.js");

    assert.match(player, /export function createVoicePlayer\(/);
    assert.match(player, /export function destroyVoicePlayer\(/);
    assert.equal((player.match(/new Audio\(\)/g) || []).length, 1);
    assert.match(player, /timeupdate/);
    assert.match(player, /loadedmetadata/);
    assert.match(player, /playbackRate/);
    assert.match(player, /ArrowLeft/);
    assert.match(player, /ArrowRight/);
    assert.match(player, /Space/);
    assert.match(player, /Enter/);
    assert.match(player, /aria-label/);
    assert.doesNotMatch(
        player,
        /firebase|firestore|storage-service|message-service|conversation/
    );
});

test("voice renderer delegates playback and composes message rendering", () => {
    const voice = read("js/renderers/voice-message-renderer.js");
    const messages = read("js/renderers/message-renderer.js");
    const bubble = read("js/components/message-bubble.js");

    assert.match(voice, /export function renderVoiceMessage\(/);
    assert.match(voice, /export function destroyVoiceMessage\(/);
    assert.match(voice, /createVoicePlayer\(/);
    assert.match(voice, /voice-message__loading/);
    assert.match(voice, /voice-message__error/);
    assert.doesNotMatch(
        voice,
        /firebase|firestore|storage-service|message-service|\.play\(/
    );
    assert.match(messages, /case MESSAGE_TYPES\.VOICE/);
    assert.match(messages, /renderVoiceMessage\(/);
    assert.match(messages, /destroyVoiceMessage\(\)/);
    assert.match(bubble, /data-voice-message-container/);
    assert.doesNotMatch(bubble, /<audio/);
});

test("conversation preferences remain user-scoped and presentation-only", () => {
    const service = read("js/services/conversation-service.js");
    const controller = read("js/controllers/conversation-controller.js");
    const messagesController = read("js/controllers/messages-controller.js");
    const messageEvents = read("js/events/message-events.js");
    const renderer = read("js/renderers/conversation-renderer.js");
    const menu = read("js/components/conversation-menu.js");
    const viewTabs = read("js/components/conversation-view-tabs.js");
    const sorter = read("js/utils/conversation-sorter.js");
    const rules = read("firestore.rules");

    assert.match(service, /export function pinConversation\(/);
    assert.match(service, /export function unpinConversation\(/);
    assert.match(service, /export function muteConversation\(/);
    assert.match(service, /export function unmuteConversation\(/);
    assert.match(service, /export function toggleMuteConversation\(/);
    assert.match(service, /export function archiveConversation\(/);
    assert.match(service, /export function unarchiveConversation\(/);
    assert.match(service, /export function toggleArchiveConversation\(/);
    assert.match(service, /export async function getConversationPreference\(/);
    assert.match(
        service,
        /export function subscribeToConversationPreferences\(/
    );
    assert.match(service, /COLLECTIONS\.CONVERSATION_PREFERENCES/);
    assert.match(controller, /subscribeToConversationPreferences\(/);
    assert.match(controller, /pinConversation\(/);
    assert.match(controller, /unpinConversation\(/);
    assert.match(controller, /toggleMuteConversation\(/);
    assert.match(controller, /toggleArchiveConversation\(/);
    assert.match(controller, /unsubscribe\(\)/);
    assert.match(
        messagesController,
        /initializeConversationPreferences\(/
    );
    assert.doesNotMatch(
        messagesController,
        /pinConversation\(|unpinConversation\(|toggleMuteConversation\(|toggleArchiveConversation\(/
    );
    assert.match(service, /sortConversations\(/);
    assert.match(controller, /sortConversations\(/);
    assert.match(messagesController, /prepareConversations\(/);
    assert.doesNotMatch(renderer, /\.sort\(|sortConversations|filter\(/);
    assert.match(renderer, /preference\.pinned/);
    assert.doesNotMatch(renderer, /firebase|firestore|addEventListener/);
    assert.match(menu, /data-conversation-action/);
    assert.doesNotMatch(menu, /conversation-service|firestore|firebase/);
    assert.match(messageEvents, /getConversationPreference\(/);
    assert.match(messageEvents, /preference\.muted !== true/);
    assert.match(messageEvents, /preference\.archived/);
    assert.match(messageEvents, /unarchiveConversation\(/);
    assert.match(viewTabs, /aria-selected/);
    assert.doesNotMatch(viewTabs, /conversation-service|firestore|firebase/);
    assert.match(sorter, /export function sortConversations\(/);
    assert.match(sorter, /export function compareConversations\(/);
    assert.doesNotMatch(sorter, /firebase|firestore|document|addEventListener/);
    assert.match(
        rules,
        /match \/users\/\{userId\}\/conversationPreferences\/\{conversationId\}/
    );
    assert.match(rules, /allow read: if isOwner\(userId\)/);
});

test("read receipt renderer owns passive message status display", () => {
    const renderer = read("js/renderers/read-receipt-renderer.js");
    const messages = read("js/renderers/message-renderer.js");
    const bubble = read("js/components/message-bubble.js");

    assert.match(renderer, /MESSAGE_STATUS\.SENT/);
    assert.match(renderer, /MESSAGE_STATUS\.DELIVERED/);
    assert.match(renderer, /MESSAGE_STATUS\.READ/);
    assert.match(renderer, /export function renderReadReceipt\(/);
    assert.match(renderer, /export function renderMessageStatus\(/);
    assert.match(renderer, /export function clearReadReceipt\(/);
    assert.doesNotMatch(
        renderer,
        /addEventListener|firestore|firebase|markMessageRead|markMessageDelivered/
    );
    assert.match(messages, /renderReadReceipt/);
    assert.match(bubble, /data-read-receipt-container/);
    assert.doesNotMatch(bubble, /function getStatusIcon/);
});

test("read receipt controller owns visibility-aware receipt updates", () => {
    const controller = read("js/controllers/read-receipt-controller.js");
    const chat = read("js/controllers/chat-controller.js");

    assert.match(controller, /export function initializeReadReceipts\(/);
    assert.match(controller, /new IntersectionObserver/);
    assert.match(controller, /threshold: READ_VISIBILITY_THRESHOLD/);
    assert.match(controller, /markMessageDelivered/);
    assert.match(controller, /markMessageRead/);
    assert.match(controller, /subscribeToReadReceipts/);
    assert.match(controller, /renderReadReceipt/);
    assert.match(controller, /intersectionObserver\?\.disconnect\(\)/);
    assert.match(controller, /subscriptions\.forEach/);
    assert.doesNotMatch(
        controller,
        /firebase|firestore|innerHTML|insertAdjacentHTML|createElement/
    );
    assert.match(chat, /initializeReadReceipts\(/);
    assert.doesNotMatch(
        chat,
        /markMessagesAsDelivered|markConversationMessagesAsRead/
    );
});

test("reaction picker owns UI behavior without service coupling", () => {
    const picker = read("js/components/reaction-picker.js");

    assert.match(picker, /export function createReactionPicker\(/);
    assert.match(picker, /export function openReactionPicker\(/);
    assert.match(picker, /export function closeReactionPicker\(/);
    assert.match(picker, /export function toggleReactionPicker\(/);
    assert.match(picker, /export function destroyReactionPicker\(/);
    assert.match(picker, /ArrowLeft/);
    assert.match(picker, /ArrowRight/);
    assert.match(picker, /Escape/);
    assert.match(picker, /getBoundingClientRect/);
    assert.match(picker, /currentReaction/);
    assert.doesNotMatch(
        picker,
        /message-service|addReaction|removeReaction|firestore|firebase/
    );
});

test("reaction renderer composes normalized reactions into messages", () => {
    const renderer = read("js/renderers/reaction-renderer.js");
    const messages = read("js/renderers/message-renderer.js");
    const bubble = read("js/components/message-bubble.js");

    assert.match(renderer, /export function renderReactionBar\(/);
    assert.match(renderer, /export function renderReactionChip\(/);
    assert.match(renderer, /export function clearReactionBar\(/);
    assert.match(renderer, /data-message-id/);
    assert.match(renderer, /data-reaction/);
    assert.match(renderer, /mine/);
    assert.doesNotMatch(
        renderer,
        /addEventListener|firestore|firebase|addReaction|removeReaction/
    );
    assert.match(messages, /renderReactionBar/);
    assert.doesNotMatch(bubble, /function renderReactions/);
});

test("reaction controller owns chat reaction orchestration", () => {
    const controller = read("js/controllers/reaction-controller.js");
    const chat = read("js/controllers/chat-controller.js");
    const messages = read("js/renderers/message-renderer.js");

    assert.match(controller, /export function initializeReactions\(/);
    assert.match(controller, /addReaction/);
    assert.match(controller, /removeReaction/);
    assert.match(controller, /subscribeToReactions/);
    assert.match(controller, /createReactionPicker/);
    assert.match(controller, /renderReactionBar/);
    assert.match(controller, /new MutationObserver/);
    assert.match(controller, /subscriptions\.forEach/);
    assert.equal(
        (controller.match(/messageContainer\.addEventListener/g) || [])
            .length,
        1
    );
    assert.match(chat, /initializeReactions\(/);
    assert.doesNotMatch(
        chat,
        /addReaction|removeReaction|subscribeToReactions|reactToMessage|ReactionPicker|renderReactionBar/
    );
    assert.match(messages, /dataset\.reactionContainer/);
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

test("presence controller coordinates lifecycle and typing cleanup", () => {
    const controller = read("js/controllers/presence-controller.js");

    assert.match(controller, /export function initializePresence\(options\)/);
    assert.match(controller, /setUserOnline/);
    assert.match(controller, /setUserOffline/);
    assert.match(controller, /setUserTyping/);
    assert.match(controller, /stopTyping/);
    assert.match(controller, /subscribeToPresence/);
    assert.match(controller, /renderPresence/);
    assert.match(controller, /removeEventListener/);
    assert.match(controller, /unsubscribe\(\)/);
    assert.doesNotMatch(
        controller,
        /firebase-firestore|onSnapshot|setDoc|innerHTML/
    );
});
