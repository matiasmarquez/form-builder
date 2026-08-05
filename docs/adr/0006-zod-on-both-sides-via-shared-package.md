# Zod schemas shared between client and server

The `FormTemplate`, `Field`, and `FieldOption` shapes are defined once as Zod schemas in `packages/shared` and consumed on both sides: the server uses them at the API boundary to parse incoming template payloads; the client uses them at the store boundary and to drive preview-time validation.

The alternative considered was Zod on the server plus hand-rolled `required && isEmpty` checks on the client. The client validation *is* almost trivial — but sharing the schemas removes an entire class of drift between what the server accepts and what the client thinks is valid, and the discriminated-union parsing (`z.discriminatedUnion('type', [...])`) is the same problem on both sides. The coupling introduced by sharing is real but small: both sides intentionally sit on top of the same source-of-truth types, and the shared package is where that truth lives (see ADR-0001).

The consequence recorded is that changing a schema means republishing `packages/shared` and rebuilding both apps together. In this monorepo that happens in one command; it would be a bigger deal in a split-repo world, which is another reason ADR-0001 and this decision live together.
