# Prefer Standard Tooling

Status: Accepted

## Context

Maintaining custom scripts is costly and violates `Be simple.`

## Decision

Unless explicitly directed otherwise, prefer the standard settings provided by TypeScript, Vite, Biome, and similar tools. Delete `scripts/check-tsconfig-coverage.mjs` and its dedicated test, and use the standard `tsc` and Biome commands.
