# 12 — Conditional visibility

**What to build:** the optional `VisibilityRule` feature — attach a rule to a field so it appears only when another field's answer matches, with the semantics defined in ADR-0005. This is the deliberate cut point if time runs out.

**Blocked by:** 10.

**Status:** ready-for-human

- [x] The editor exposes a UI to attach a `VisibilityRule` to any field, referencing another field's answer
- [x] Supported triggers: equality on `radio` and `select` answers; "includes option X" on `checkbox` answers
- [x] The preview evaluates all `VisibilityRule`s as a fixed point on every relevant `Answer` change until visibility is stable
- [x] A hidden field is removed from the DOM (not merely hidden with CSS)
- [x] When a field becomes hidden, its `Answer` in the `FormResponse` is cleared
- [x] Hidden fields are excluded from validation on submit, even when `required` is true
- [x] Cascading rules work (a hidden field can itself gate other fields)
- [x] Save-time cycle detection: attempting to save a template whose rule graph contains a cycle returns a clear error and the save is refused
- [x] Vitest covers: single-rule visibility, cascading visibility, cycle detection, answer-clearing on hide, and validation exclusion of hidden fields
