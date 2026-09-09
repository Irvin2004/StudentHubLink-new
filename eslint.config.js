import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

const sharedRules = {
    "no-unused-vars": [
        "error",
        {
            argsIgnorePattern: "^_",
            caughtErrors: "none",
            varsIgnorePattern: "^_"
        }
    ]
};

export default [
    {
        ignores: [
            "js/**",
            "dist/**",
            "node_modules/**",
            ".cache/**",
            "functions/node_modules/**",
            "coverage/**",
            "playwright-report/**",
            "test-results/**"
        ]
    },
    eslint.configs.recommended,
    {
        files: ["src/**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser
            }
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh
        },
        rules: {
            ...sharedRules,
            ...reactHooks.configs.flat.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                {
                    allowConstantExport: true
                }
            ]
        }
    },
    {
        files: [
            "test/**/*.js",
            "scripts/**/*.js",
            "scripts/**/*.mjs",
            "*.config.js"
        ],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node
            }
        },
        rules: sharedRules
    },
    {
        files: ["functions/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                ...globals.node
            }
        },
        rules: sharedRules
    }
];
