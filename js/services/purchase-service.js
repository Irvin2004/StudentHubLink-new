import { log } from "../utils/logger.js";

export async function processPurchase(resource, user) {
    if (!resource || !user) {
        return;
    }

    log("PURCHASE", "Purchase engine", {
        resourceId: resource.id,
        userId: user.uid
    });
}
