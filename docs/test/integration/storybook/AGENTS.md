# Storybook Integration Specification Instructions

- Document public UI contracts verified by Storybook `play` functions. Keep end-to-end user flows in `docs/test/e2e` and persistence, subscriptions, and Rules in `docs/test/integration/firestore`.
- Follow the Japanese case format and ID-only correspondence rules in `../../AGENTS.md`. Do not add Story file or named-export mappings.
- Use `STORYBOOK-<UPPERCASE-SPEC-FILENAME>-<NN>` IDs, starting at `01` in document order without gaps. Update indexes, anchors, and headings together; README files index specifications rather than define cases.
- Use `render` for visible states and attributes, and `interaction` for results of user operations. These categories do not imply persistence.
- Describe setup inline without E2E fixtures or dedicated fixture files. Keep each Given / When / Then to one block and split independent behaviors into separate IDs.
- A shared play may verify several cases. Describe the prerequisite state in Given without naming the Story export; prior operations may establish that state, but this does not imply independent test execution.
- A case may cover multiple display variants. Describe each variant's inputs and expected results instead of listing export names.
- Distinguish verified assertions from rendering-only stories, setup-only plays, skipped tests, and missing assertions. A callback notification does not prove persistence, navigation, or downloaded contents.
- Keep unimplemented or unverified expectations explicit. An ID match from `lint:test-specs` is not evidence that a play ran or verified its Then clauses.
