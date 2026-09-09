# V2 real-account authorization results

Passed on 2026-09-09 at 04:26 UTC against `studenthub-c9bc0`. All 13 assertions
used real Firebase Authentication email/password sign-ins and the client
Firestore SDK, without an emulator or administrative credentials for the
assertions. Firebase CLI administrative access was used only to prepare isolated
fixtures and inspect the deployed rules.

Deployed ruleset: `2b19c480-27e5-494c-b98c-4c66842c2942`. Its source matched the
local `firestore.rules` before testing.

| Requested boundary                           | Evidence                                                                                    | Result |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| Student A can read/write own private data    | Create, read, update own study task                                                         | PASS   |
| Student A cannot read/write B's private data | Read/update B's existing task and create a task under B denied; private profile read denied | PASS   |
| Moderator can perform intended moderation    | Pin, unpin, soft-delete another student's message                                           | PASS   |

Additional controls passed: Student B could create their own private task; an
ordinary member could not pin another student's message; Student B's task
remained unchanged after forbidden write attempts. Expected denials returned
`permission-denied`, rather than network or validation failures.

## Dedicated fixtures

Private community: `qa-auth-1788927944095`.

| Account   | Firebase UID                   | Community role |
| --------- | ------------------------------ | -------------- |
| Student A | `efQNZaATLqhdWrB7OfBbSZj5qNI2` | member         |
| Student B | `7tanOx7s1hZxAAAWDE1AeKNR3fk1` | owner          |
| Moderator | `frZ0kRMghWcJFBsgynT2dTwMVky1` | moderator      |

All three user profiles have the global `student` role and private visibility.
Moderator privileges are restricted to the dedicated QA community. Student B's
community ownership does not alter the ownership checks on private study data.
These are newly created test identities with synthetic `example.com` addresses,
not existing students. No site-wide admin role was granted.

Accounts and private fixtures are retained for repeat testing. The test message
is soft-deleted at the end of the run. Test passwords are random and stored only
in Windows DPAPI-encrypted `.cache/live-auth/credentials.dpapi`, protected for
the current Windows user. They were not printed or committed. SDK sessions were
signed out after testing.

Local runner: `.cache/live-auth/run.cjs`. Sanitized account identifiers and
individual results: `.cache/live-auth/results.json`. The runner reuses these
identities and resets only its dedicated fixtures.

This verifies the requested representative private-data and community moderation
boundaries. It does not establish every private collection, site-wide admin
operation, marketplace approval flow, or Storage rule. No rules or deployments
were changed during this check.
