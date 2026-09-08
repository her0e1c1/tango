# Adopt Feature-Sliced Design

Status: Accepted

## Context

The frontend is being organized around explicit architectural boundaries. A shared architectural baseline is needed so directory placement and dependency decisions are consistent as the codebase evolves.

## Decision

Adopt [Feature-Sliced Design (FSD)](https://feature-sliced.design/) as the baseline architectural methodology for the frontend.

Follow FSD's core layering and dependency principles while allowing project-specific segment names and conventions when they make responsibilities clearer. Project-specific rules documented in ADRs take precedence when they intentionally differ from conventional FSD structure.

Keep `src` for production FSD layers. Storybook and test support that must compose across multiple production layers belongs outside `src`; do not classify cross-layer development helpers as Shared production code. See [PR #550](https://github.com/her0e1c1/tango/pull/550).
