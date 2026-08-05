# Conditional visibility clears hidden answers and excludes them from validation

The spec explicitly asks the implementer to define how hidden fields interact with validation and with the data they hold. Our answer: when a `VisibilityRule` evaluates to false, the field is removed from the DOM, its `Answer` in the `FormResponse` is cleared, and it is excluded from validation on submit — even if `required` is true.

The rejected alternatives: (a) keep hidden required fields blocking submission — technically correct against a naive reading of "required," but the resulting UX ("something is required, but you cannot see it") is broken; (b) keep the hidden field's answer around in case it becomes visible again — introduces a stale-data class of bug where re-showing a field surfaces an answer the respondent gave to a different question earlier in the session.

"Hidden means gone" composes cleanly with the rest of the system: the whole-snapshot undo/redo does not care, submission validation only iterates visible fields, and the respondent's mental model matches ("I do not see it, so it does not exist right now"). Visibility is evaluated as a fixed-point across cascading rules; cycles in rule references are detected and rejected at save time rather than allowed at runtime.
