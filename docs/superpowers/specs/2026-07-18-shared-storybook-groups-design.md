# Shared Storybook Groups Design

## Goal

Reflect the responsibility-based `src/shared/components` directory structure in the Storybook sidebar instead of listing every shared component directly under `Shared`.

## Scope

Update the explicit Storybook `title` in all 27 stories under `src/shared/components`:

- `content` stories use `Shared/Content/<Component>`.
- `feedback` stories use `Shared/Feedback/<Component>`.
- `forms` stories use `Shared/Forms/<Component>`.
- `layout` stories use `Shared/Layout/<Component>`.

For example, `Shared/Card` becomes `Shared/Content/Card`, and `Shared/FullScreen` becomes `Shared/Layout/FullScreen`.

Feature stories, component implementations, exports, and the source directory structure remain unchanged.

## Implementation

Keep each story's explicit `title` and insert its responsibility group as the middle Storybook path segment. This preserves the existing `Shared` root and component names while creating the four sidebar groups. No shared title helper or Storybook-wide automatic title configuration is needed.

## Verification

- Add a focused static contract test that reads shared story metadata and verifies every story title matches its containing responsibility group.
- Build Storybook through the repository's existing checks to confirm the updated metadata is valid.
- Run `make check` before publishing the pull request.
