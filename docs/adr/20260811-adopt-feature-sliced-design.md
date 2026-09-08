# Adopt Feature-Sliced Design

Status: Accepted

## Context

The frontend is being organized around explicit architectural boundaries. A shared architectural baseline is needed so directory placement and dependency decisions are consistent as the codebase evolves.

## Decision

Adopt [Feature-Sliced Design (FSD)](https://feature-sliced.design/) as the baseline architectural methodology for the frontend.

Follow FSD's core layering and dependency principles while allowing project-specific segment names and conventions when they make responsibilities clearer. Project-specific rules documented in ADRs take precedence when they intentionally differ from conventional FSD structure.

Cross-layer and cross-slice consumers use the owning slice's Public API. Application contracts are explicit module imports rather than ambient declarations. Keep `src` for production FSD layers; Storybook and test support that must compose across multiple production layers belongs outside `src` and is not Shared production code.

Enforce dependency direction, slice isolation, and Public API access with Steiger rather than duplicating FSD rules across general-purpose linters. See [PR #542](https://github.com/her0e1c1/tango/pull/542), [PR #550](https://github.com/her0e1c1/tango/pull/550), [PR #617](https://github.com/her0e1c1/tango/pull/617), and [PR #623](https://github.com/her0e1c1/tango/pull/623).
