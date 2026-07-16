# Local Firebase Development Design

## Goal

Make `mise dev` start Tango against local Firebase services without requiring a real Firebase project or API key.

## Design

- Add a committed `.env.dev` with project ID `demo-tango`, a non-secret local API key, Firestore at `localhost:8080`, and Auth at `localhost:9099`. Add a `.gitignore` exception for this shared file.
- Run Vite in `dev` mode so it loads `.env.dev` after the existing base `.env` file.
- Keep the existing Google Cloud SDK Firestore container. Add an Auth service based on the existing Tango image, which already contains `firebase-tools`, and run `firebase emulators:start --only auth --project demo-tango --config firebase.json` bound to `0.0.0.0:9099`.
- Configure the Auth emulator host and port in `firebase.json`, and give the service an HTTP healthcheck.
- Publish both emulator ports to the host for the host-run Vite process.
- Make `mise up` pass `--env-file .env.dev` to Compose so container interpolation uses the same ports as Vite.
- Connect Firebase Auth to the emulator only when `import.meta.env.MODE === "dev"`. Keep production and test behavior unchanged.
- Start both emulator services from the `mise up` dependency used by `mise dev`.

## Data Flow

1. `mise dev` starts the Firestore and Auth containers.
2. Vite loads `.env` and then `.env.dev`, with `.env.dev` overriding Firebase development values.
3. The browser initializes Firebase with the demo project configuration.
4. Firestore requests go to `localhost:8080` and authentication requests go to `localhost:9099`.

## Verification

- Unit-test that `dev` mode connects the exported Auth instance to the configured emulator URL.
- Unit-test that non-`dev` modes do not connect Auth to an emulator.
- Validate the Compose configuration.
- Run `mise dev` and confirm both emulator services become healthy and Vite starts without `auth/invalid-api-key`.
- Run `make check` before completion.
