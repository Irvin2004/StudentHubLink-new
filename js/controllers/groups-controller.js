import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { createGroupCard } from "../components/group-card.js";
import { openLeaveGroupDialog } from "../components/leave-group-dialog.js";
import { createEmptyState } from "../components/empty-state.js";
import {
    getStudyGroupMemberships,
    getStudyGroups,
    joinStudyGroup,
    leaveStudyGroup
} from "../services/group-service.js";
import { handleError } from "../utils/error-handler.js";
import { showToast } from "../utils/toast.js";

const auth = getAuth();

const groupList =
document.getElementById("groupList");

const searchInput =
document.getElementById("groupSearch");

const moduleFilter =
document.getElementById("moduleFilter");

const resultCount =
document.getElementById("groupResultCount");

let currentUser = null;
let groups = [];
let joinedGroupIds = new Set();

function populateModuleFilter(items) {
    if (!moduleFilter) {
        return;
    }

    const modules = Array.from(
        new Set(
            items
                .map((group) => group.moduleName?.trim())
                .filter(Boolean)
        )
    ).sort((firstModule, secondModule) =>
        firstModule.localeCompare(secondModule)
    );

    moduleFilter.innerHTML =
        '<option value="">All subjects</option>';

    modules.forEach((moduleName) => {
        const option = document.createElement("option");
        option.value = moduleName.toLowerCase();
        option.textContent = moduleName;
        moduleFilter.appendChild(option);
    });
}

function matchesSearch(group, term) {
    if (!term) {
        return true;
    }

    const searchableValues = [
        group.name,
        group.moduleName,
        group.moduleCode,
        ...(group.tags || [])
    ];

    return searchableValues.some((value) =>
        String(value || "")
            .toLowerCase()
            .includes(term)
    );
}

function renderGroups(items) {
    if (!groupList) {
        return;
    }

    if (resultCount) {
        resultCount.textContent =
            `${items.length} ${items.length === 1 ? "group" : "groups"}`;
    }

    groupList.setAttribute("aria-busy", "false");

    if (!items.length) {
        groupList.innerHTML = createEmptyState(
            "No study groups found",
            "Try another search term or subject filter.",
            "&#128218;"
        );
        return;
    }

    groupList.innerHTML = items
        .map((group) =>
            createGroupCard(group, {
                joined: joinedGroupIds.has(group.id),
                owner: group.ownerId === currentUser?.uid
            })
        )
        .join("");
}

function applyFilters() {
    const term =
        searchInput?.value.trim().toLowerCase() || "";

    const selectedModule =
        moduleFilter?.value || "";

    const filteredGroups = groups.filter((group) => {
        const matchesModule =
            !selectedModule ||
            group.moduleName?.toLowerCase() === selectedModule;

        return matchesModule && matchesSearch(group, term);
    });

    renderGroups(filteredGroups);
}

async function loadGroups(user) {
    if (groupList) {
        groupList.innerHTML = `
            <div class="group-card-skeleton"></div>
            <div class="group-card-skeleton"></div>
            <div class="group-card-skeleton"></div>
        `;
    }

    try {
        groups = await getStudyGroups();

        joinedGroupIds =
        await getStudyGroupMemberships(
            groups.map((group) => group.id),
            user.uid
        );

        populateModuleFilter(groups);
        applyFilters();
    } catch (error) {
        handleError(
            error,
            "Unable to load study groups."
        );

        if (groupList) {
            groupList.innerHTML = createEmptyState(
                "Study groups are unavailable",
                "Please try again in a moment.",
                "&#9888;"
            );
        }
    }
}

searchInput?.addEventListener("input", applyFilters);
moduleFilter?.addEventListener("change", applyFilters);

groupList?.addEventListener("click", async (event) => {
    const button =
        event.target.closest(
            '[data-action="toggle-group-membership"]'
        );

    if (!button || !currentUser || button.disabled) {
        return;
    }

    const groupId = button.dataset.groupId;
    const group = groups.find(
        (item) => item.id === groupId
    );

    if (!group) {
        return;
    }

    const joined = joinedGroupIds.has(groupId);

    if (joined) {
        button.disabled = true;

        const confirmed =
        await openLeaveGroupDialog(group.name);

        if (!confirmed) {
            button.disabled = false;
            return;
        }

        button.textContent = "Leaving...";

        try {
            const left = await leaveStudyGroup({
                groupId,
                userId: currentUser.uid
            });

            joinedGroupIds.delete(groupId);

            if (left) {
                group.memberCount = Math.max(
                    1,
                    Number(group.memberCount || 1) - 1
                );
            }

            showToast(
                `You left ${group.name}.`,
                "success"
            );
        } catch (error) {
            handleError(
                error,
                "Unable to leave this group."
            );
        } finally {
            applyFilters();
        }

        return;
    }

    button.disabled = true;
    button.textContent = "Joining...";

    try {
        const membershipCreated =
        await joinStudyGroup({
            groupId,
            user: currentUser
        });

        joinedGroupIds.add(groupId);

        if (membershipCreated) {
            group.memberCount =
                Number(group.memberCount || 0) + 1;
        }

        showToast(
            membershipCreated
                ? `You joined ${group.name}.`
                : `You are already a member of ${group.name}.`,
            "success"
        );
    } catch (error) {
        handleError(
            error,
            "Unable to join this group."
        );
    } finally {
        applyFilters();
    }
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = user;
    loadGroups(user);
});