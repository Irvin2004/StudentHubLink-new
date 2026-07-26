import { getApp, getApps, initializeApp } from "firebase/app";

import { getFirebaseEnvironment } from "../config/environment.js";

export const firebaseConfig = getFirebaseEnvironment();
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
