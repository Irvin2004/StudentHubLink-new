const FIREBASE_ENVIRONMENT_FIELDS = Object.freeze({
    apiKey: "VITE_FIREBASE_API_KEY",
    authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
    projectId: "VITE_FIREBASE_PROJECT_ID",
    storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
    appId: "VITE_FIREBASE_APP_ID",
    measurementId: "VITE_FIREBASE_MEASUREMENT_ID"
});

const REQUIRED_FIREBASE_FIELDS = Object.freeze([
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId"
]);

/**
 * Reads and validates Firebase's public web configuration from Vite.
 *
 * @param {ImportMetaEnv|Record<string, string>} environment
 * @returns {Readonly<Record<string, string>>}
 */
export function getFirebaseEnvironment(environment = import.meta.env || {}) {
    const config = Object.fromEntries(
        Object.entries(FIREBASE_ENVIRONMENT_FIELDS).map(
            ([field, environmentName]) => [
                field,
                String(environment[environmentName] || "").trim()
            ]
        )
    );
    const missingFields = REQUIRED_FIREBASE_FIELDS.filter(
        (field) => !config[field]
    );

    if (missingFields.length) {
        const missingVariables = missingFields
            .map((field) => FIREBASE_ENVIRONMENT_FIELDS[field])
            .join(", ");

        throw new Error(
            `Missing Firebase environment variables: ${missingVariables}. ` +
                "Copy .env.example to .env.local and provide the values."
        );
    }

    return Object.freeze(config);
}

export { FIREBASE_ENVIRONMENT_FIELDS, REQUIRED_FIREBASE_FIELDS };
