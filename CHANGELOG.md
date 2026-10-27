# Changelog

All notable changes to this project are documented in this file.
The format follows Keep a Changelog 1.1.0. Dates use YYYY-MM-DD.

## [Unreleased]

### Changed

- README and site add a labelled install line that also adds ~/.local/bin to ~/.profile, and a pinned line on the site.

## [0.10.1] - 2026-10-28

### Added

- Machine-friendly `--version --short` and `--version --json` CLI output.
- `GHOSTPAW_NO_MODIFY_PATH=1` Windows installer opt-out for persistent user PATH changes.

### Notes

- The v0.10.0 tag stopped at the size gate and was not published; 0.10.1 is the first published release with webhooks.

## [0.10.0] - 2026-10-28

### Added

- Opt-in signed outbound event webhooks with persistent deduplication, tag and event filters, batched delivery, retries, and delivery review.
- `hook` management, one-shot `tick`, signal-aware `watch`, and a webhook verification guide.
- Async webhook library namespace and `manage_hooks` tool support across CLI and MCP.

## [0.9.2] - 2026-10-27

### Changed

- Embed workflow guides in the CLI with guide listing and help.
- Expand skill parameter tables and include schema-checked call examples.
- Validate nested and action-specific tool input before execution, with recovery shapes.
- Release binary installation is the default in the README and generated skill, with explicit installer targets.
- Human CLI version output includes the binary, npm, or library variant.
- `add` accepts a positional title and rejects giving the title twice.
- Flag values may start with dashes unless they look like a long flag.

## [0.9.1] - 2026-10-27

### Changed

- `show <id>` prints `tags : -` for a quest without tags, like other empty fields.
- The skill cheat sheet starts with the `npx -y @ghostpaw/questlog <command>` fallback for machines without install.sh, and says to run `search` before `add` to avoid duplicates.
- The Node version error names common ways to install Node 24+.

## [0.9.0] - 2026-10-27

### Added

- `questlog` bin alias next to `ghostpaw-questlog`; install.sh and install.ps1 create it unless another `questlog` command is already in the install directory.
- `show <id>` prints every quest field on its own line (objective, state, tags, due, created, started, finished, outcome) and `show --json` returns full detail.
- Plain-command JSON adds an ISO 8601 `<field>Iso` next to each epoch-ms `<field>At`. `call` and MCP output are unchanged.
- `list` prints `due 28 Oct` and `!overdue` for open quests past their due date.
- `--due` accepts YYYY-MM-DD, DD.MM.YYYY, `today`, `tomorrow` and `+3d` (local end of day) as well as ISO date-times; `--tag a,b` splits on commas.
- `--help` prints the resolved database path and the `--db` / `GHOSTPAW_QUESTLOG_DB` overrides; a new database file is reported as `created <path>` on stderr.
- The bundled skill starts with a cheat sheet of the plain commands, exit codes and database location; MCP and `call` usage moved to an appendix.
- Unknown commands suggest the closest match (`Unknown command: lsit. Did you mean list?`, exit 2).

### Fixed

- The npm CLI exits 2 with `questlog needs Node 24+ (found X)` on Node below 24, before loading `node:sqlite`. Before, Node 20 printed help and then failed on the first command with ERR_UNKNOWN_BUILTIN_MODULE.
- Compact quest detail includes `outcome` and `resolvedAt` once a quest is resolved, so `done --outcome` text shows in `show`, `list --view quests.resolved` and their JSON.

## [0.8.0] - 2026-10-27

### Added

- Standalone binaries for Linux, macOS and Windows, checksum-verifying install scripts, and release build and install checks (2026-10-27).

### Fixed

- `run_quest` `finish`, `abandon` and `abandon_and_spawn_followups` without an `outcome` return `needs_clarification` (`missing_required_choice`, `missing: ["outcome"]`) instead of a TypeError; `done <id>` without `--outcome` prints the question and exits 3 (2026-10-27).

## [0.7.0] - 2026-10-27

### Added

- Plain CLI commands `add`, `list`, `done`, `search`, and `show`, with command help, short text output, and optional full tool JSON (2026-10-27).

## [0.6.2] - 2026-10-24

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

[Unreleased]: https://github.com/GhostPawJS/questlog/compare/v0.10.1...HEAD
[0.10.1]: https://github.com/GhostPawJS/questlog/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/GhostPawJS/questlog/compare/v0.9.2...v0.10.0
[0.9.2]: https://github.com/GhostPawJS/questlog/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/GhostPawJS/questlog/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/GhostPawJS/questlog/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/GhostPawJS/questlog/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/GhostPawJS/questlog/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/GhostPawJS/questlog/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/GhostPawJS/questlog/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/GhostPawJS/questlog/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/GhostPawJS/questlog/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/GhostPawJS/questlog/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/GhostPawJS/questlog/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/GhostPawJS/questlog/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/GhostPawJS/questlog/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/GhostPawJS/questlog/releases/tag/v0.1.0
