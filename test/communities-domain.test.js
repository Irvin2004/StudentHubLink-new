import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const read = (path) =>
    readFile(join(process.cwd(), ...path.split("/")), "utf8");

test("community models and validation remain independent of Firebase and React", async () => {
    const files = await Promise.all([
        read("src/models/community.js"),
        read("src/models/community-member.js"),
        read("src/utils/community-validation.js"),
        read("src/config/community-roles.js"),
        read("src/config/community-permissions.js")
    ]);

    for (const source of files) {
        assert.doesNotMatch(
            source,
            /from\s+["'][^"']*(?:firebase|firestore|react)[^"']*["']/i
        );
    }
});

test("the community service owns the complete Firestore API", async () => {
    const service = await read("src/services/community-service.js");

    for (const method of [
        "createCommunity",
        "updateCommunity",
        "deleteCommunity",
        "joinCommunity",
        "leaveCommunity",
        "getCommunity",
        "getCommunityMembershipIds",
        "getCommunities",
        "searchCommunities",
        "addMember",
        "removeMember",
        "updateMemberRole"
    ]) {
        assert.match(
            service,
            new RegExp(`export (?:async )?function ${method}\\(`)
        );
    }

    assert.match(service, /runTransaction/);
    assert.match(service, /normalizedName/);
    assert.doesNotMatch(service, /document\.|window\.|innerHTML|useState/);
});

test("the community hook exposes domain state without importing Firebase", async () => {
    const hook = await read("src/hooks/useCommunities.js");

    for (const member of [
        "communities",
        "loading",
        "createCommunity",
        "joinCommunity",
        "leaveCommunity",
        "refreshCommunities"
    ]) {
        assert.match(hook, new RegExp(`\\b${member}\\b`));
    }

    assert.doesNotMatch(hook, /firebase|firestore/i);
});

test("channel uniqueness and positioning use bounded Firestore reads", async () => {
    const service = await read("src/services/channel-service.js");

    assert.match(service, /where\("name", "==", name\)/);
    assert.match(service, /orderBy\("position", "desc"\)/);
    assert.match(service, /limit\(1\)/);
    assert.match(service, /Promise\.all/);
    assert.doesNotMatch(
        service,
        /getDocs\(getChannelsReference\(communityId\)\)/
    );
    assert.match(service, /ACTIVITY_TYPES\.CHANNEL_CREATED/);
    assert.match(service, /createActivity\(communityId/);
});

test("community permissions stay centralized across content surfaces", async () => {
    const [permissions, channelPermissions, messageItem, fileModel] =
        await Promise.all([
            read("src/config/community-permissions.js"),
            read("src/config/channel-permissions.js"),
            read("src/components/chat/MessageItem/MessageItem.jsx"),
            read("src/models/file.js")
        ]);

    for (const guard of [
        "canEditCommunity",
        "canDeleteCommunity",
        "canManageMembers",
        "canDeleteCommunityMessage",
        "canDeleteCommunityFile"
    ]) {
        assert.match(permissions, new RegExp(`function ${guard}\\(`));
    }

    assert.match(channelPermissions, /hasCommunityPermission/);
    assert.match(messageItem, /canDeleteCommunityMessage/);
    assert.match(fileModel, /canDeleteCommunityFile/);
    assert.doesNotMatch(messageItem, /MANAGER_ROLES|role\s*===/);
});

test("Firestore rules enforce community membership and moderation boundaries", async () => {
    const rules = await read("firestore.rules");

    assert.match(rules, /function isCommunityModerator\(communityId\)/);
    assert.match(
        rules,
        /userId == request\.auth\.uid[\s\S]*request\.resource\.data\.role == "member"/
    );
    assert.match(
        rules,
        /request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)[\s\S]*\.hasOnly\(\["nickname"\]\)/
    );
    assert.match(rules, /resource\.data\.role != "owner"/);
    assert.match(rules, /allow delete: if isCommunityManager\(communityId\)/);
    assert.match(
        rules,
        /resource\.data\.senderId == request\.auth\.uid[\s\S]*resource\.data\.deleted == false[\s\S]*request\.resource\.data\.edited == true/
    );
    assert.match(
        rules,
        /resource\.data\.senderId == request\.auth\.uid[\s\S]*isCommunityModerator\(communityId\)[\s\S]*request\.resource\.data\.deleted == true/
    );
    assert.match(
        rules,
        /isCommunityModerator\(communityId\)[\s\S]*\.hasOnly\(\["pinnedAt", "pinnedBy", "updatedAt"\]\)/
    );
});
