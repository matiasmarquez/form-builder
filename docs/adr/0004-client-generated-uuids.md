# Client-generated UUIDs for all entities

Every `FormTemplate`, `Field`, and `FieldOption` gets its `id` from `crypto.randomUUID()` on the client, at the moment it is created in the editor. The server accepts client-assigned IDs on `POST /templates` and returns `409 Conflict` on duplicate primary key. SQLite does not autoincrement anything.

Fields and options are created, reordered, undone, and redone entirely in the client store before any save happens — so they must have client-generated IDs regardless. The only real choice was whether template IDs should join them or come from the server. Client-generating template IDs too unifies the model — `id: string` everywhere, one generation strategy — and removes a class of transitions the store would otherwise have to model ("template has no ID yet," "template's ID changed after first save," foreign-key-like references from fields to a not-yet-saved parent). Autosave becomes trivially idempotent: the client can POST the same template twice and the server upserts on the known ID.

The alternative — server-generated integer template IDs with client UUIDs for fields and options — was rejected because it leaves `FormTemplate.id: number | null` next to `Field.id: string`, which is jarring in the type system and requires a "pending ID" state in the editor store.

Constraint recorded: this is defensible because the app is single-user and single-tenant. In a multi-tenant context with untrusted clients, letting the client pick primary keys would be a security concern and this decision should be revisited.
