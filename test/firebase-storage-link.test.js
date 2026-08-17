import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

function read(path) {
    return readFileSync(new URL(path, root), "utf8");
}

test("community uploads link Storage objects to Firestore file IDs", () => {
    const service = read("src/services/file-service.js");
    const storageRules = read("storage.rules");
    const firestoreRules = read("firestore.rules");

    assert.match(
        service,
        /FILES\}\/\$\{metadataReference\.id\}\/\$\{storedName\}/
    );
    assert.match(service, /fileId: metadataReference\.id/);
    assert.match(
        storageRules,
        /match \/communities\/\{communityId\}\/channels\/\{channelId\}\/files\/\{fileId\}\/\{fileName\}/
    );
    assert.match(storageRules, /request\.resource\.metadata\.fileId == fileId/);
    assert.ok(firestoreRules.includes("+ '/files/' + fileId + '/[^/]+$'"));
});

test("legacy community files cannot be overwritten", () => {
    const storageRules = read("storage.rules");
    const legacyRule = storageRules.slice(
        storageRules.indexOf(
            "match /communities/{communityId}/channels/{channelId}/files/{legacyFileName}"
        )
    );

    assert.match(legacyRule, /allow create, update: if false/);
    assert.match(legacyRule, /allow read: if isCommunityMember\(communityId\)/);
});
