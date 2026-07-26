import { useContext } from "react";

import { NotificationContext } from "../context/notification-context.js";

export function useNotifications() {
    return useContext(NotificationContext);
}
