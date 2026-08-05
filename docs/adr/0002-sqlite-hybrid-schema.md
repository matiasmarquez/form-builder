# SQLite hybrid schema: columns for metadata, JSON body for fields

The `form_templates` table stores queryable metadata as real columns (`id TEXT PRIMARY KEY`, `title`, `description`, `created_at`, `updated_at`) and the entire ordered list of `Field`s as a single JSON column (`body JSON`). We do not normalise fields and options into separate tables.

A `FormTemplate` is document-shaped: the field list is heterogeneous (five variants with divergent properties), always read whole, always written whole, and never queried across templates. A 3NF schema (`form_templates` + `fields` + `field_options`) would force reconstruction on every read, produce migrations that are painful to write for a shape that keeps evolving, and buy us nothing — we never ask "find all templates whose second field is a radio." The metadata columns exist because the list view needs to show titles sorted by `updated_at` without pulling every body.

The trade-off recorded here is that field-level querying is not possible without JSON1 extraction. That is acceptable for this project. If a future feature needs cross-template field queries, the fields can be projected into a separate table without changing the write model.
