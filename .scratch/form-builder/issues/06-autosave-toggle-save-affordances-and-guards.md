# 06 — Autosave, toggle, explicit save, and navigation guards

**What to build:** the full save experience for the editor — autosave by default, a global user toggle to disable it, an explicit Save button, `Cmd`/`Ctrl+S` shortcut, save-status indicator in the header, and navigation guards so unsaved changes cannot be lost by accident.

**Blocked by:** 04, 05.

**Status:** ready-for-human

- [x] The editor store tracks `isPersisted` (has this template ever saved?) and `isDirty` (does in-memory differ from last successful save?) as two independent flags
- [x] A new form (not yet persisted) is POSTed on first save; subsequent saves PUT to `/templates/:id`
- [x] Autosave is debounced (starting value: 800ms; the value must be a single named constant that is easy to change)
- [x] Failed saves keep the change in memory, keep `isDirty` true, and surface a "Failed — retry" state with a manual retry action
- [x] A global autosave toggle persists in `localStorage` and applies to every form (not per-form)
- [x] When autosave is off, no automatic save requests fire
- [x] The header always shows one of: `New form — not saved yet` (`!isPersisted`), `Saving…`, `Saved • Ns ago`, `Failed — retry`, or `Unsaved changes` when autosave is off and the form is dirty
- [x] A Save button in the header is enabled exactly when `isDirty` is true, regardless of autosave setting
- [x] `Cmd+S` on macOS and `Ctrl+S` on Windows/Linux save immediately: when autosave is on, they force-flush any pending debounce; when autosave is off, they save directly
- [x] The browser's `beforeunload` event triggers a native "unsaved changes" warning if and only if `isDirty` is true
- [x] A vue-router route-leave guard prompts for confirmation if and only if `isDirty` is true
- [x] Autosave never commits a `HistoryStep`

## Comments

Implemented on `master`. Notes:

- New store flags on `useEditorStore`: `isPersisted`, `isDirty`, `saveStatus` (`idle | saving | saved | failed`), `lastSavedAt`, `lastSaveError`. `isDirty` flips to `true` at the very top of `beginStep()` so it flags even coalesced in-flight typing (before any HistoryStep is committed). Undo/redo also mark dirty — a round-trip through history can leave the in-memory template different from the last save.
- `initializeTemplate(id)` is the New-form path (unpersisted, clean). `loadTemplate(t)` is the "opened an existing form" path (persisted, clean, `saveStatus='saved'`).
- `save()` picks POST vs PUT off `isPersisted`. It snapshots the template, bumps `updatedAt`, sends via an injected `TemplateSaveTransport` (wired in `main.ts` to the HTTP client), and on success only clears `isDirty` if the current in-memory template still equals the snapshot — so an edit mid-save keeps `isDirty=true` and the change survives the roundtrip.
- Autosave lives in a separate `useAutosaveStore` (global toggle, `localStorage['form-builder.autosave-enabled']`, defaults to on). The wiring is in a `useAutosave()` composable used by `EditorView`: `watch(editor.isDirty)` schedules a debounced save; `watch(enabled)` cancels any pending timer when the user turns autosave off. `flushPending()` forces the timer to fire immediately — used by `Cmd/Ctrl+S`.
- Debounce constant is `AUTOSAVE_DEBOUNCE_MS = 800` in `apps/web/src/stores/editor.ts` — single named constant per the spec.
- Guards live in `useUnsavedGuards()`: a `beforeunload` handler that sets `returnValue = ''` iff `isDirty`, and `onBeforeRouteLeave()` that prompts iff `isDirty`.
- Header (`EditorHeader.vue`) renders the five status strings with the priority listed in the spec and re-renders "Saved • Ns ago" once a second via a 1Hz `setInterval` tick. The Save button is `disabled` iff `!isDirty`, regardless of autosave setting. A "Retry" affordance appears next to a `Failed — retry` status.
- `EditorView` now boots the editor by fetching the template from the API; a 404 (surfaced as `TemplateNotFoundError`) falls through to `initializeTemplate(id)` so a client-minted UUID becomes a real form on first save. `HomeView` got a "+ New form" button that navigates to `/forms/<crypto.randomUUID()>/edit`.
- Vitest environment stayed at `node`; the one test that needs `localStorage` (`autosave.test.ts`) installs a tiny in-memory shim before importing the store, avoiding the jsdom-with-node-24 `require(ESM)` failure.
- Tests: `apps/web/src/stores/editor.save.test.ts` covers isDirty/isPersisted flips, POST-then-PUT ordering, failed-save state, mid-save edit preservation, and undo-marks-dirty. `apps/web/src/stores/autosave.test.ts` covers the localStorage toggle. Full suite: 48 tests passing.
