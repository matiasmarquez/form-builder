# Whole-snapshot undo/redo

Undo/redo is implemented by pushing a full deep-cloned snapshot of the current `FormTemplate` onto a history stack on every committed action. We do not use a command pattern (per-action `do` / `undo` objects) or a patch-based approach (immer-style forward and inverse patches).

At the sizes forms will realistically reach (dozens of fields, hundreds of small option strings), a snapshot is a few kilobytes and cloning is microseconds. The command pattern would multiply implementation cost across every mutation site — every "add field," "toggle required," "reorder options" would need a paired inverse — for zero user-visible benefit at this scale. Patches sit in between and buy the worst of both worlds here: still per-action bookkeeping, still non-trivial to reason about, still no user-visible improvement.

The consequence to remember: memory use is O(history depth × template size). A history cap (e.g. 100 steps) is a reasonable guard. If forms ever grow to thousands of fields — they will not — this decision would need to be revisited.
