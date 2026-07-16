# Adopt Biome

Status: Accepted

## Context

Using ESLint and Prettier required separate formatter and linter dependencies, plugins, and configuration. Consolidating them reduces dependencies and maintenance. Biome is implemented in Rust, provides fast checks, and has strong community adoption.

## Decision

Replace ESLint and Prettier with Biome 2.5.3, pinned exactly, while preserving `tsc`, existing npm script names, formatting and linting scopes, and key lint policies. The migration was implemented in [PR #223](https://github.com/her0e1c1/tango/pull/223).

## Consequences

Formatting and linting use one tool and configuration with fewer dependencies and faster checks. Application runtime behavior is unchanged. Biome upgrades require reviewing rule and formatting changes because its behavior and rule set do not exactly match ESLint and Prettier.
