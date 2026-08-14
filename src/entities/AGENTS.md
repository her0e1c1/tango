# Entities Instructions

- Treat `src/entities` as the domain layer.
- Keep domain models, schemas, business rules, and domain logic pure.
- Global Entity stores and thin selector hooks are allowed as an exception.
- Do not place any other responsibilities in `entities`, including UI, use cases, external access, subscriptions, or asynchronous workflows.
