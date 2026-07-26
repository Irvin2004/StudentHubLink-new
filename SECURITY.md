# Security Policy

StudentHub handles identity, student profiles, private conversations, community
membership, and uploaded files. Security reports are taken seriously and should
be shared privately.

## Supported versions

StudentHub is currently completing its production-readiness milestone. Until a
formal support schedule is published, security fixes are applied to the latest
default branch and the latest published release.

| Version                  | Security support      |
| ------------------------ | --------------------- |
| Current default branch   | Supported             |
| Latest published release | Supported             |
| Older releases and forks | No guaranteed support |

This table will be replaced with explicit version ranges when the next release
is tagged.

## Reporting a vulnerability

Do **not** open a public issue, discussion, or pull request for a suspected
vulnerability.

Use the repository's private vulnerability-reporting page:

[Report a StudentHub security vulnerability privately](https://github.com/Irvin2004/StudentHubLink-new/security/advisories/new)

If private reporting is unavailable, contact the
[repository maintainer](https://github.com/Irvin2004) without including
vulnerability details in a public message. Ask for a private communication
channel first.

Use the title `StudentHub Security Report` and include:

- a clear description of the issue;
- the affected page, service, rule, function, or data path;
- prerequisites and account roles required;
- exact reproduction steps;
- a minimal proof of concept when safe;
- potential impact;
- affected browsers or environments;
- suggested mitigation, if known; and
- whether the issue has been disclosed elsewhere.

Remove real student data, access tokens, credentials, private messages, and
unrelated personal information from the report.

## Response targets

The maintainers aim to:

- acknowledge a report within 48 hours;
- complete initial triage within 7 calendar days;
- provide progress updates at least every 7 days while investigation continues;
- agree on a disclosure timeline with the reporter; and
- release a fix as quickly as the risk and testing requirements allow.

These are best-effort targets, not a service-level agreement. Complex issues,
upstream Firebase problems, and coordinated releases may require more time.

## Scope

Security issues include, but are not limited to:

- authentication or account-recovery bypass;
- authorization or privilege-escalation flaws;
- Firestore or Storage Rule misconfiguration;
- access to private conversations or communities;
- insecure direct object references;
- cross-site scripting;
- injection into Firestore, Storage paths, or Cloud Functions;
- exposed private credentials or service-account material;
- unsafe file uploads or unrestricted file access;
- sensitive information in logs, errors, or public documents;
- notification or event spoofing;
- role, ownership, or membership validation failures;
- vulnerable Cloud Function endpoints; and
- dependency vulnerabilities with a practical StudentHub impact.

### Generally out of scope

Unless they demonstrate meaningful security impact, the following are normally
out of scope:

- social engineering or physical attacks;
- denial-of-service or load testing against live infrastructure;
- automated scanner output without validation;
- missing headers on a local development server;
- attacks requiring a deliberately compromised device or browser extension;
- issues in unsupported forks;
- public Firebase web identifiers without a demonstrated access-control flaw;
- rate-limit observations without a practical exploit; and
- vulnerabilities already publicly disclosed and being handled upstream.

Do not test against accounts, communities, conversations, or files you do not
own or have explicit permission to access.

## Current security controls

StudentHub currently uses:

- Firebase Authentication for user identity;
- Firestore Security Rules for document authorization;
- Storage Rules for file ownership, membership, type, extension, and size
  enforcement;
- deny-by-default fallbacks in Firestore and Storage rules;
- role and protected-field checks;
- client-side model validation and normalization;
- bounded queries where supported;
- Cloud Functions for selected trusted derived-data operations;
- centralized safe user-facing error messages;
- restricted storage paths based on user, group, and conversation ownership; and
- Git ignore rules for environment files, credentials, logs, emulator exports,
  and generated artifacts.

Client-side validation improves feedback but is never the security boundary.
Security Rules and trusted backend code must independently enforce every
sensitive operation.

## Production security requirements

The following controls must be completed or verified before a public production
launch:

- verification of production GitHub environment values and access controls;
- HTTPS-only production hosting;
- Firebase API-key restrictions;
- Firebase App Check where appropriate;
- complete Firestore and Storage Rules tests;
- dependency and secret scanning in CI;
- Content Security Policy and security-header review;
- production-safe logging and monitoring;
- backup and recovery procedures;
- abuse and rate-limit controls;
- a complete authorization audit; and
- periodic dependency, rule, and application security reviews.

Do not describe a planned control as implemented until it has been deployed and
verified.

## Authentication

StudentHub relies on Firebase Authentication. StudentHub does not store user
passwords directly.

Authentication establishes identity; it does not grant access by itself.
Firestore Rules, Storage Rules, and trusted backend code must verify the
authenticated user's ownership, membership, role, and requested operation.

Authentication tokens must be verified by Firebase Admin SDK or another trusted
backend mechanism when used by server-side endpoints. Tokens must never be
written to logs or committed to the repository.

## Firestore authorization

Firestore Rules are stored in [`firestore.rules`](firestore.rules). Changes to
collections, fields, roles, memberships, or cross-user events require a matching
rules review.

At minimum, rule tests should cover:

- unauthenticated access;
- owner and non-owner access;
- member and non-member access;
- student and admin roles;
- immutable protected fields;
- allowed and rejected status transitions;
- forged cross-user notifications;
- private conversation access; and
- invalid or oversized data.

Never weaken a rule merely to make a client request succeed. Confirm the data
path and intended authorization model first.

## File-upload security

File uploads are validated in both the client and Storage Rules.

Current general attachment controls include:

- a maximum size of 25 MB;
- an allowlist of MIME types;
- an allowlist of filename extensions;
- sanitized generated storage names;
- authenticated ownership or membership checks; and
- storage paths scoped to a user, group, or conversation.

Profile images are limited to 5 MB and JPEG, PNG, or WebP. Voice messages are
limited to 25 MB and WebM or Ogg.

Executable and script file types are not accepted. A filename extension alone is
not sufficient validation. Future production hardening may include malware
scanning, content inspection, quarantine, and signed-download workflows.

## Secrets and Firebase configuration

Never commit:

- service-account JSON;
- private keys;
- OAuth client secrets;
- access or refresh tokens;
- private webhook secrets;
- production `.env` files; or
- user data exported from Firebase.

Firebase web configuration identifies a Firebase project and is delivered to the
browser. It must still be restricted and protected by Authentication, Security
Rules, App Check where enabled, and API-key policy. It must never be treated as
authorization.

If a secret is committed, revoke or rotate it immediately. Removing it from the
latest commit does not remove it from Git history.

## Responsible research

Security research must:

- use accounts and data you own or have permission to test;
- minimize access to personal information;
- avoid persistence, destructive changes, and service disruption;
- stop testing and report immediately if unrelated private data is exposed;
- preserve evidence securely; and
- allow reasonable time for remediation before disclosure.

Good-faith research that follows this policy will not be treated as malicious
activity by the StudentHub maintainers.

## Coordinated disclosure

Please keep vulnerability details private until a fix is available and affected
users have had a reasonable opportunity to update.

When appropriate, the maintainers will:

- confirm the affected versions;
- prepare and test a fix;
- update Security Rules or backend services;
- publish a security advisory;
- credit the reporter if requested; and
- document any required user action.

Thank you for helping protect StudentHub and its users.
