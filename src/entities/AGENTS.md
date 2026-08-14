# Entities Instructions

- Treat `src/entities` as the domain layer and owner of global entity state.
- Keep domain models, domain logic, global entity state, and simple read/write interfaces here.
- Domain/business logic that spans multiple entities also belongs in `entities`.
- Limit entity stores to entity data and simple operations such as replace and clear.
- Simple selector hooks may expose entity data to consumers.
- Do not place UI, use cases, Firestore/Firebase access, subscriptions, loading/error/retry state,
  complex asynchronous workflows, or feature-specific processing in entities.
