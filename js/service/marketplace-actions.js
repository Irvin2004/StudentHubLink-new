import { processDownload } from "./download-engine.js";
import { processPurchase } from "./purchase-engine.js";

export async function handleResourceAction(resource, user) {
    if (!resource || !user) {
        return;
    }

    if ((resource.price || 0) > 0) {
        await processPurchase(resource, user);
    } else {
        await processDownload(resource, user);
    }
}
