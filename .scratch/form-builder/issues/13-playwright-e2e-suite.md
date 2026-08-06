# 13 — Playwright end-to-end suite

**What to build:** the end-to-end test suite covering the high-value flows from the spec's Seam 2, runnable against the real Hono + SQLite backend.

**Blocked by:** 06, 08, 09, 10, 11.

**Status:** wontfix

- [ ] Playwright is set up in the monorepo with a documented `pnpm test:e2e` command that boots both apps in test mode
- [ ] Test: create a new form, add one field of each of the five types, edit labels and options, wait for autosave, refresh the page, and verify all changes are still there
- [ ] Test: turn autosave off, make a change, verify no save network request fires, press `Cmd/Ctrl+S`, verify the change is saved; attempt to navigate away with unsaved changes and verify the guard prompt appears
- [ ] Test: open preview, submit an empty required form, verify an inline error appears on the first invalid field and it receives focus; fix the errors and submit successfully
- [ ] Test: perform a sequence of editor mutations, press undo repeatedly to reach the initial state, then redo repeatedly to reach the final state again; verify the DOM matches at each end
- [ ] Test: reorder a field using only the keyboard, verify the new order persists after autosave + refresh
- [ ] If ticket 12 has landed: a test covering conditional visibility (setting a rule, verifying the target shows/hides, verifying the answer clears on hide, verifying validation skips it)
- [ ] Tests use a separate SQLite database file so they do not stomp on dev data

## Comments

- Out of scope for this effort. Left as `wontfix` so agents do not pick it up.
