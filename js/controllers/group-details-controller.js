import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { openLeaveGroupDialog } from "../components/leave-group-dialog.js";
import { createOrGetGroupConversation } from "../services/conversation-service.js";
import {
    getStudyGroup,
    getStudyGroupMembers,
    getStudyGroupMemberships,
    joinStudyGroup,
    leaveStudyGroup
} from "../services/group-service.js";
import { escapeHtml } from "../utils/dom.js";
import { handleError } from "../utils/error-handler.js?security=1";
import { showToast } from "../utils/toast.js";

const auth = getAuth();

const groupId =
new URLSearchParams(window.location.search).get("id");

const loadingState =
document.getElementById("groupDetailLoading");

const detailContent =
document.getElementById("groupDetailContent");

const joinButton =
document.getElementById("groupJoinButton");
const groupChatButton =
document.getElementById("groupChatButton");

const groupResourcesLink =
document.getElementById("groupResourcesLink");

const assignmentsTab =
document.getElementById("assignmentsTab");

const groupDetailTabs =
document.getElementById("groupDetailTabs");

let currentUser = null;
let currentGroup = null;
let currentMembers = [];
let isJoined = false;

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function renderTags(tags = []) {
    const container =
    document.getElementById("groupDetailTags");

    if (!container) {
        return;
    }

    container.innerHTML = tags
        .map((tag) => `<span>#${escapeHtml(tag)}</span>`)
        .join("");
}

function renderMembers(members) {
    const memberList =
    document.getElementById("groupMemberPreview");

    if (!memberList) {
        return;
    }

    const previewMembers = members.slice(0, 6);

    if (!previewMembers.length) {
        memberList.innerHTML =
            '<p class="text-secondary">No members to preview yet.</p>';
        return;
    }

    memberList.innerHTML = previewMembers
        .map((member) => {
            const name =
                member.displayName || "Student";

            return `
                <li>
                    <span class="group-member-avatar">
                        ${escapeHtml(name.charAt(0).toUpperCase())}
                    </span>
                    <span>
                        <strong>${escapeHtml(name)}</strong>
                        <small>${escapeHtml(member.role || "member")}</small>
                    </span>
                </li>
            `;
        })
        .join("");
}

function updateJoinButton() {
    if (!joinButton || !currentGroup) {
        return;
    }

    const isOwner =
        currentGroup.ownerId === currentUser?.uid;

    const isPrivate =
        currentGroup.visibility === "private";

    groupDetailTabs?.classList.toggle(
        "hidden",
        !(isOwner || isJoined)
    );

    joinButton.disabled =
        isOwner || (!isJoined && isPrivate);

    joinButton.classList.toggle(
        "group-joined-button",
        isJoined && !isOwner
    );

    joinButton.classList.toggle(
        "group-owner-button",
        isOwner
    );

    groupChatButton?.classList.toggle(
        "hidden",
        !(isOwner || isJoined)
    );
    groupResourcesLink?.classList.toggle(
        "hidden",
        !(isOwner || isJoined)
    );
    assignmentsTab?.classList.toggle(
        "hidden",
        !(isOwner || isJoined)
    );

    if (groupResourcesLink) {
        groupResourcesLink.href =
            `group-resources.html?id=${encodeURIComponent(currentGroup.id)}`;
    }

    if (isOwner) {
        joinButton.textContent = "Owner";
    } else if (isJoined) {
        joinButton.textContent = "✓ Joined";
    } else if (isPrivate) {
        joinButton.textContent = "Private group";
    } else {
        joinButton.textContent = "Join group";
    }
}
function renderGroup(group, members) {
    const moduleLabel =
        [group.moduleName, group.moduleCode]
            .filter(Boolean)
            .join(" · ");

    setText("groupDetailName", group.name);
    setText("groupDetailModule", moduleLabel);
    setText(
        "groupDetailDescription",
        group.description ||
        "A study community for students learning together."
    );
    setText(
        "groupDetailMemberCount",
        `${Number(group.memberCount || 0)} members`
    );
    setText(
        "groupDetailVisibility",
        group.visibility === "private"
            ? "Private"
            : "Public"
    );

    renderTags(group.tags || []);
    renderMembers(members);
    updateJoinButton();

    loadingState?.classList.add("hidden");
    detailContent?.classList.remove("hidden");
}

async function loadGroup(user) {
    if (!groupId) {
        window.location.href = "groups.html";
        return;
    }

    try {
        const [group, members, memberships] =
        await Promise.all([
            getStudyGroup(groupId),
            getStudyGroupMembers(groupId),
            getStudyGroupMemberships(
                [groupId],
                user.uid
            )
        ]);

        currentGroup = group;
        currentMembers = members;
        isJoined = memberships.has(groupId);

        renderGroup(group, members);
    } catch (error) {
        handleError(
            error,
            "Unable to load this study group."
        );

        if (loadingState) {
            loadingState.innerHTML = `
                <h1>Group unavailable</h1>
                <p>We could not find this study group.</p>
                <a class="btn btn-primary" href="groups.html">
                    Browse study groups
                </a>
            `;
        }
    }
}

assignmentsTab?.addEventListener("click", () => {
    if (
        !currentGroup ||
        (!isJoined && currentGroup.ownerId !== currentUser?.uid)
    ) {
        return;
    }

    window.location.href =
        `group-assignments.html?id=${encodeURIComponent(currentGroup.id)}`;
});

groupChatButton?.addEventListener("click", async () => {
    if (!currentGroup || (!isJoined && currentGroup.ownerId !== currentUser?.uid)) {
        return;
    }

    groupChatButton.disabled = true;
    groupChatButton.textContent = "Opening chat...";

    try {
        const conversation = await createOrGetGroupConversation({
            groupId: currentGroup.id,
            title: currentGroup.name,
            memberCount: currentGroup.memberCount
        });

        window.location.href = `chat.html?id=${conversation.id}`;
    } catch (error) {
        handleError(error, "Unable to open the group chat.");
        groupChatButton.disabled = false;
        groupChatButton.innerHTML =
            '<span aria-hidden="true">&#128172;</span> Chat';
    }
});
joinButton?.addEventListener("click", async () => {
    if (
        !currentUser ||
        !currentGroup ||
        joinButton.disabled
    ) {
        return;
    }

    if (isJoined) {
        joinButton.disabled = true;

        const confirmed =
        await openLeaveGroupDialog(
            currentGroup.name
        );

        if (!confirmed) {
            updateJoinButton();
            return;
        }

        joinButton.textContent = "Leaving...";

        try {
            const left = await leaveStudyGroup({
                groupId,
                userId: currentUser.uid
            });

            isJoined = false;

            if (left) {
                currentGroup.memberCount = Math.max(
                    1,
                    Number(currentGroup.memberCount || 1) - 1
                );

                currentMembers = currentMembers.filter(
                    (member) =>
                        member.userId !== currentUser.uid
                );

                renderMembers(currentMembers);

                setText(
                    "groupDetailMemberCount",
                    `${currentGroup.memberCount} members`
                );
            }

            showToast(
                `You left ${currentGroup.name}.`,
                "success"
            );
        } catch (error) {
            handleError(
                error,
                "Unable to leave this group."
            );
        } finally {
            updateJoinButton();
        }

        return;
    }

    joinButton.disabled = true;
    joinButton.textContent = "Joining...";

    try {
        const membershipCreated =
        await joinStudyGroup({
            groupId,
            user: currentUser
        });

        isJoined = true;

        if (membershipCreated) {
            currentGroup.memberCount =
                Number(currentGroup.memberCount || 0) + 1;

            currentMembers.push({
                userId: currentUser.uid,
                displayName:
                    currentUser.displayName ||
                    currentUser.email ||
                    "Student",
                role: "member"
            });

            renderMembers(currentMembers);

            setText(
                "groupDetailMemberCount",
                `${currentGroup.memberCount} members`
            );
        }

        showToast(
            `You joined ${currentGroup.name}.`,
            "success"
        );
    } catch (error) {
        handleError(
            error,
            "Unable to join this group."
        );
    } finally {
        updateJoinButton();
    }
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = user;
    loadGroup(user);
});
