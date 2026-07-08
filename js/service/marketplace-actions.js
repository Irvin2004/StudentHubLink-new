import { addActivity } from "./activity.js";
import { createNotification } from "./notifications.js";
import { addToLibrary } from "./library.js";
import {
    getResourceAction,
    RESOURCE_ACTION
} from "../utils/constants.js";

export async function handleResourceAction(resource, user) {

    if (!resource || !user) return;

    const action =
        getResourceAction(resource);

    await addToLibrary(resource, user, action);

    await addActivity({

        userId: user.uid,

        type: action,

        title:
            action === RESOURCE_ACTION.PURCHASE
                ? "Resource purchased"
                : "Resource downloaded",

        description: resource.title,

        icon:
            action === RESOURCE_ACTION.PURCHASE
                ? "sale"
                : "download"

    });

    await createNotification({

        userId: user.uid,

        title:
            action === RESOURCE_ACTION.PURCHASE
                ? "Purchase successful"
                : "Download ready",

        message:
            action === RESOURCE_ACTION.PURCHASE
                ? `${resource.title} has been added to your library.`
                : `${resource.title} is ready for download.`

    });
    
}
