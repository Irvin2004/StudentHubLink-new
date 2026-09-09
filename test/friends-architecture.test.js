import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("friends remain behind one service and protected route", () => {
    const routes = read("src/config/routes.js");
    const router = read("src/routes/AppRouter.jsx");
    const service = read("src/features/friends/services/friend-service.js");
    const page = read("src/features/friends/FriendsPage.jsx");

    assert.match(routes, /FRIENDS: "\/app\/friends"/);
    assert.match(router, /path=\{ROUTES\.FRIENDS\}/);
    assert.doesNotMatch(page, /firebase\/firestore/);
    assert.match(service, /export async function sendFriendRequest/);
    assert.match(service, /export async function acceptFriendRequest/);
    assert.match(service, /export async function declineFriendRequest/);
    assert.match(service, /export async function cancelFriendRequest/);
    assert.match(service, /export async function removeFriend/);
});

test("friend writes and notifications are constrained by Firestore rules", () => {
    const rules = read("firestore.rules");
    assert.match(rules, /match \/friendRequests\/\{requestId\}/);
    assert.match(rules, /request\.resource\.data\.status == "pending"/);
    assert.match(rules, /request\.resource\.data\.updatedAt == request\.time/);
    assert.match(rules, /match \/friends\/\{friendId\}/);
    assert.match(rules, /friendNotificationIsValid/);
});
