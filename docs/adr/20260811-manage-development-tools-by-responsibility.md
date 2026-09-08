# Manage Development Tools by Responsibility

Status: Accepted

## Context

Development tools have different installation and reproducibility requirements. Treating every development tool as an npm `devDependency` makes ownership unclear and can add unnecessary project dependencies.

## Decision

Manage tools according to their responsibility and distribution model:

- Use `devDependencies` for Node.js ecosystem tools required to build, lint, test, or otherwise reproduce project checks, such as TypeScript, Biome, ESLint, Vitest, Playwright, Storybook, and Knip.
- Use `mise.toml` for language runtimes, package managers, and standalone CLI tools distributed outside npm, such as Node.js, npm, and Hadolint.
- Manage tools used only inside containers within the container environment, rather than duplicating them in npm or mise.
- Do not add optional, interactive, developer-specific tools to project dependencies. Tools such as React Developer Tools should be installed individually when needed.

Use npm scripts as the canonical executable entrypoints for repository checks. CI installs the pinned Node.js and npm versions and invokes those npm scripts without requiring mise. Local mise tasks may compose or delegate to the same scripts. Workflow-specific external service setup, such as starting the Firestore emulator, remains in the owning workflow or container environment.

Prefer the tool's official distribution channel and avoid managing the same tool in multiple places unless reproducibility requires it. See [PR #449](https://github.com/her0e1c1/tango/pull/449) and [PR #662](https://github.com/her0e1c1/tango/pull/662).
