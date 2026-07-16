# Local Firebase Development Design

## Goal

Make `mise dev` start Tango against local Firebase services without requiring a real Firebase project or API key.

## Design

- Add `.env.dev` with a demo project ID, a non-secret local API key, and localhost ports for Firestore and Auth.
- Run Vite in `dev` mode so it loads `.env.dev` after the existing base `.env` file.
- Keep the existing Google Cloud SDK Firestore container and add a separate Firebase Auth Emulator container.
- Publish both emulator ports to the host for the host-run Vite process.
- Connect Firebase Auth to the emulator only when Vite runs in `dev` mode. Keep production and test behavior unchanged.
- Start both emulator services from the `mise up` dependency used by `mise dev`.

## Data Flow

1. `mise dev` starts the Firestore and Auth containers.
2. Vite loads `.env` and then `.env.dev`, with `.env.dev` overriding Firebase development values.
3. The browser initializes Firebase with the demo project configuration.
4. Firestore requests go to `localhost:8080` and authentication requests go to `localhost:9099`.

## Verification

- Unit-test that development initialization connects the exported Auth instance to the configured emulator.
- Validate the Compose configuration.
- Run `mise dev` and confirm both emulator services become healthy and Vite starts without `auth/invalid-api-key`.
- Run `make check` before completion.
