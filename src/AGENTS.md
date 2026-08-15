# Source Instructions

## Store Compatibility

- The product is under active development. Do not preserve backward compatibility for store state unless explicitly requested.
- Breaking changes to store state shape and behavior are allowed. Prefer the simplest current design over compatibility layers.
- In particular, do not add migrations or retain legacy state formats for Zustand `persist`. Invalidate or discard incompatible persisted state instead.
