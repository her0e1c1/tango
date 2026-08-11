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

Prefer the tool's official distribution channel and avoid managing the same tool in multiple places unless reproducibility requires it.
