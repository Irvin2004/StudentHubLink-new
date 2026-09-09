# V2 authenticated accessibility and mobile review

Date: 2026-09-08. Candidate: 2.0.0-rc.1. Target:
https://studenthub-c9bc0.web.app (deployed authenticated app).

## Result

Follow-up, 2026-09-09: the drawer issue is fixed locally. Opening now makes
visibility immediate while retaining the slide animation, so its existing focus
effect can focus Close navigation. The Tab trap also recovers focus if it is
outside the drawer. A local browser fixture using the production drawer,
Sidebar, and styles passed at 375px: Enter/Space opening, initial focus,
Shift+Tab/Tab boundary wrapping, Escape, and close-button focus restoration.
Regression unit tests cover closed-to-open entry and outside-focus recovery.
`npm run check` passed, including 544 unit tests, architecture checks, and
build. This fix has not yet been deployed or rechecked on Firebase Hosting; the
live findings below describe the earlier deployed build.

The responsive smoke checks passed for the available page states at 375, 768,
1024, and 1440 CSS pixels, with a 900-pixel viewport height. No document-level
horizontal overflow was observed. Accessibility sign-off is **not passed**: the
mobile navigation drawer fails keyboard focus entry and containment.

Measurements used actual browser viewport widths and rendered DOM geometry.
Accessibility-tree inspection and keyboard interaction were supplemented with
screenshots of the Dashboard, mobile drawer, selected flashcard deck, Settings,
mobile quiz dialog, and mobile/tablet Thuto dialog. This is a focused browser
regression pass, not a complete WCAG conformance audit or physical-device test.

## Width coverage

All four requested widths were checked for each row below.

| Screen        | State exercised                                   | Horizontal overflow |
| ------------- | ------------------------------------------------- | ------------------- |
| Dashboard     | Existing QA task, deck, quiz, recommendations     | None                |
| Communities   | Loaded empty results, search/category controls    | None                |
| Chat          | Open-a-community-channel empty state              | None                |
| Friends       | Empty connections state                           | None                |
| Resources     | Empty library, filters, upload membership message | None                |
| Study Planner | Existing QA task, progress and empty analytics    | None                |
| Flashcards    | Deck library and selected existing deck/card      | None                |
| Quizzes       | Existing quiz library                             | None                |
| Thuto         | Open input dialog                                 | None                |
| Notifications | Empty notification centre                         | None                |
| Settings      | Theme, text size, motion and contrast controls    | None                |

## Keyboard results

- Dashboard: Tab reaches the skip link and then the mobile navigation opener.
- Mobile drawer: Enter opens it, but focus stays on **Open navigation** outside
  the drawer. The next Tab moves to **Search StudentHub** behind the overlay.
  Reproduced independently on Resources and Chat after the drawer had settled.
  Escape closes the drawer and restores focus to its opener. Reverse traversal
  can reach the drawer links, but ordinary forward entry is broken.
- Add Study Task: Enter opens the dialog and focuses Title. Shift+Tab reaches
  Close, then wraps to Add Task; Tab wraps back to Close. Escape restores the
  Add Study Task trigger.
- Create Deck: Space opens the dialog and focuses Deck name. Reverse/forward
  boundary traversal stays inside; Escape restores Create Deck.
- Create Quiz: Enter opens the dialog and focuses Quiz title. Boundary traversal
  and Escape restoration worked, including at mobile width.
- Create community: Enter opens the dialog and focuses Community name.
  Reverse/forward boundary traversal and Escape restoration worked.
- Thuto: Enter on Ask Thuto opens the dialog and focuses Subject or topic.
  Shift+Tab traverses action/close controls and wraps to the footer Close
  button; Tab wraps to Close dialog. Escape restores Ask Thuto.
- Account menu: Enter focuses Profile. Tab moves to Settings, Shift+Tab returns
  to Profile; Escape closes the menu and restores the account trigger.
- Resource upload: Enter expands the inline panel; Space collapses it. The
  account is told to join a community with a channel before uploading.
- Settings: Tab from Theme reaches Text size; Shift+Tab returns to Theme.
- Notifications: Tab from expanded preferences reaches the first checkbox;
  Shift+Tab returns to the disclosure, and Space collapses it.

No messages, requests, uploads, tasks, decks, quizzes, or preferences were saved
or deleted during this pass. The viewport override was reset afterwards.

## Release blocker

**Fix mobile drawer keyboard focus before accessibility sign-off.**

Reproduction at 375px:

1. Focus Open navigation and press Enter.
2. Wait for the drawer to open.
3. Observe focus remains on the opener.
4. Press Tab: focus moves to Search StudentHub behind the drawer.

Expected: focus enters Close navigation or an appropriate first drawer control;
Tab and Shift+Tab remain in the drawer until dismissal; Escape returns focus to
the opener. Relevant implementation:
`src/components/layout/MobileDrawer/MobileDrawer.jsx` (focus effect and trap).
The source intends to focus the close button; its existence does not establish
that the deployed browser behavior works. No implementation fix or deployment
was made as part of this test report.

## Coverage still needed

The signed-in account has no community memberships, friends, resources, or
notifications. Populated channel chat (composer, message menus and attachments),
community detail, resource preview, friend requests and notification items need
appropriate existing QA fixtures before those flows can be signed off. Quiz
attempts and flashcard review sessions were not submitted. Thuto generation was
not invoked; only its input dialog was checked.

Screen-reader announcements, measured color contrast, browser zoom/reflow,
virtual-keyboard behavior, and real iOS/Android device coverage remain outside
this focused pass. Empty-state width checks do not establish populated-state
coverage.
