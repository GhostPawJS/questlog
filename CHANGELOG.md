# Changelog

All notable changes to this project are documented in this file.
The format follows Keep a Changelog 1.1.0. Dates use YYYY-MM-DD.

## [Unreleased]

### Changed

- The homepage and MCP Registry website URL now point to ghostpaw.dev.

## [0.6.1] - 2026-10-24

### Changed

- Search no longer scans the quests table and probes the full-text index once per row. The full-text index now drives the join, which takes a search over 10,000 quests from hundreds of milliseconds to well under a millisecond for selective queries. Results and ordering are unchanged, and no schema change or migration is needed.

## [0.6.0] - 2026-10-24

### Added

- MCP stdio server and public MCP entry, CLI, and Agent Skill generated from the tool registry.
- Directory manifests, Dockerfile, and MCP Bundle packaging.
- Size, API, consumer, startup, and ratchet guards with benchmark fixtures.
- Contributor and usage guidance, including caller-managed SQLite WAL and a 5000 ms busy timeout (2026-10-24).
- Release history reconstructed from version tags and commits (2026-10-24).

### Changed

- run_quest refuses to start a blocked quest unless force is true; the library startQuest is unchanged.
- CI verifies that the package has no runtime dependencies (2026-10-24).

### Fixed

- Performance regression test uses the best of three equivalent workloads with the existing 750 ms limit to tolerate transient contention (2026-10-24).
- README root type example uses the exported `QuestDetail` type (2026-10-24).

## [0.5.1] - 2026-04-06

### Fixed

- Switch npm publishing to GitHub OIDC trusted publishing and correct workflow syntax.

## [0.5.0] - 2026-04-03

### Added

- `updateRumor` and the `update_rumor` tool action for enriching rumor details.

## [0.4.0] - 2026-04-02

### Changed

- Expand quest schemas in `shape_work` and clarify the tool description.

## [0.3.0] - 2026-04-02

### Changed

- Flatten tool `oneOf` schemas into merged objects with an action discriminator.

## [0.2.0] - 2026-04-02

### Added

- Interactive demo and build, watch, and serve scripts.

### Fixed

- Improve tool input schema compatibility across providers.

## [0.1.0] - 2026-03-21

### Added

- Initial SQLite task and calendar model with quests, questlines, rumors, recurrence, tags, rewards, and unlocks.
- Semantic markers, structured tool facade, workflow skills, and usage documentation.
- ESM and CommonJS bundles with TypeScript declarations and native Node test execution.

[Unreleased]: https://github.com/GhostPawJS/questlog/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/GhostPawJS/questlog/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/GhostPawJS/questlog/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/GhostPawJS/questlog/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/GhostPawJS/questlog/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/GhostPawJS/questlog/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/GhostPawJS/questlog/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/GhostPawJS/questlog/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/GhostPawJS/questlog/releases/tag/v0.1.0
