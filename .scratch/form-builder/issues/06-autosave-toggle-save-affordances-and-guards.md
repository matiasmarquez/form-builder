# 06 — Autosave, toggle, explicit save, and navigation guards

**What to build:** the full save experience for the editor — autosave by default, a global user toggle to disable it, an explicit Save button, `Cmd`/`Ctrl+S` shortcut, save-status indicator in the header, and navigation guards so unsaved changes cannot be lost by accident.

**Blocked by:** 04, 05.

**Status:** ready-for-agent

- [ ] The editor store tracks `isPersisted` (has this template ever saved?) and `isDirty` (does in-memory differ from last successful save?) as two independent flags
- [ ] A new form (not yet persisted) is POSTed on first save; subsequent saves PUT to `/templates/:id`
- [ ] Autosave is debounced (starting value: 800ms; the value must be a single named constant that is easy to change)
- [ ] Failed saves keep the change in memory, keep `isDirty` true, and surface a "Failed — retry" state with a manual retry action
- [ ] A global autosave toggle persists in `localStorage` and applies to every form (not per-form)
- [ ] When autosave is off, no automatic save requests fire
- [ ] The header always shows one of: `New form — not saved yet` (`!isPersisted`), `Saving…`, `Saved • Ns ago`, `Failed — retry`, or `Unsaved changes` when autosave is off and the form is dirty
- [ ] A Save button in the header is enabled exactly when `isDirty` is true, regardless of autosave setting
- [ ] `Cmd+S` on macOS and `Ctrl+S` on Windows/Linux save immediately: when autosave is on, they force-flush any pending debounce; when autosave is off, they save directly
- [ ] The browser's `beforeunload` event triggers a native "unsaved changes" warning if and only if `isDirty` is true
- [ ] A vue-router route-leave guard prompts for confirmation if and only if `isDirty` is true
- [ ] Autosave never commits a `HistoryStep`
