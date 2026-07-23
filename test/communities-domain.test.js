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
