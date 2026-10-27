---
name: questlog
description: "Manage local tasks, calendar commitments, and recurring work. Use when planning, executing, reviewing, or organizing work."
license: "MIT"
compatibility: "Release binary needs no runtime. npx requires Node.js 24 or newer. MCP stdio or ghostpaw-questlog CLI."
---

# questlog

## Install

Linux/macOS:

```sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/questlog/main/install.sh | sh
```

Installs `~/.local/bin/ghostpaw-questlog` after checking SHA256SUMS.

Windows x64 (PowerShell):

```powershell
irm https://raw.githubusercontent.com/GhostPawJS/questlog/main/install.ps1 | iex
```

Run tools as `ghostpaw-questlog ...`; use `~/.local/bin/ghostpaw-questlog` if it is not on PATH.

`questlog` and `ghostpaw-questlog` are the same binary.

- `questlog search <words>` before `add` to avoid duplicates.
- `ghostpaw-questlog add "..." --tag a,b --due tomorrow`
- `questlog list [--view <view>]`: questlines, quests.active, quests.available, quests.blocked, quests.deferred, quests.due_soon, quests.in_progress, quests.missed_scheduled, quests.open, quests.overdue, quests.resolved, quests.scheduled_for_day, quests.scheduled_now, repeatables.due_anchors, rumors.
- `questlog done <id> --outcome "..."`
- `questlog search <words>`
- `questlog show <id>`
- Use `--json` on any plain command.
- Exit codes: 0 ok / 1 error / 2 usage / 3 needs input.
- Database: `~/.ghostpaw/questlog.db`; override with `--db` or `GHOSTPAW_QUESTLOG_DB`.
- Use one database per agent or project.

## Appendix: MCP and tool calls

Questlog manages local tasks, calendar commitments, and recurring work. Search before creating work, inspect before changing it, and keep uncertain work as rumors. Use unlock prerequisites to sequence work. run_quest refuses blocked starts unless force is true. Review commitments and resolve work with an honest outcome.

### Calling tools

MCP: connect to ghostpaw-questlog, then call a tool by name with its JSON arguments.

CLI: `ghostpaw-questlog call <tool> '<JSON object>'` or `ghostpaw-questlog <tool> --parameter value`.

Inspect schemas with `ghostpaw-questlog describe <tool>`. Use `--db <path>` to select a database.

### search_questlog

Search quests and rumors by text when you need to find an existing item before inspecting or changing it.

Use when: Use this first when the exact quest, rumor, or id is not already known.

Not for: Do not use this when you already know the exact item id and want its full detail.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| query | string | yes | Text to search for in rumor and quest titles and body text. |
| limit | integer | no | Maximum number of matches to return. |
| kinds | array | no | Optional entity kinds to search. |
| mode | string | no | browse, identify_one. Whether to browse results normally or ask for clarification when several matches are found. |

### review_questlog

Review one operational questlog surface such as available quests, open rumors, blocked work, or due repeatable anchors.

Use when: Use this when you want a dashboard-style list view instead of inspecting one specific item.

Not for: Do not use this when you already know the exact item you want to inspect in depth.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| view | string | yes | questlines, quests.active, quests.available, quests.blocked, quests.deferred, quests.due_soon, quests.in_progress, quests.missed_scheduled, quests.open, quests.overdue, quests.resolved, quests.scheduled_for_day, quests.scheduled_now, repeatables.due_anchors, rumors. Which operational review surface to return. |
| filters | object | no | Optional filters for supported review surfaces. |
| now | integer | no | Optional evaluation timestamp for time-sensitive views. |

### inspect_questlog_item

Inspect one specific questlog item in depth and return its richer structured detail and important related refs.

Use when: Use this when you already know the target item id and want either compact or full detail for one rumor, quest, questline, or repeatable quest.

Not for: Do not use this to discover items when the exact target is not known yet.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| target | object | yes | The specific item to inspect. |
| detailLevel | string | no | compact, full. How much detail to return. |
| now | integer | no | Optional evaluation timestamp for time-sensitive detail. |

### capture_rumor

Capture uncertain incoming work as a rumor so it can be triaged later without prematurely turning it into committed execution.

Use when: Use this when something matters enough to record but is not yet ready to become a quest or questline.

Not for: Do not use this for already-committed work that should be created directly as a quest or questline.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| title | string | yes | Short rumor title describing the incoming signal or possible work. |
| details | string | no | Optional supporting context that explains why the rumor might matter. |
| now | integer | no | Optional creation timestamp for the rumor. |

### shape_work

Create a quest (with timing, tags, and objective in one call), create a questline, settle a rumor into concrete work, or manage quest-questline membership. Use create_quest for clear commitments — include tags and timing directly to avoid follow-up calls.

Use when: Use this when deciding what real work exists and how it should be grouped before or around execution. Prefer a single create_quest call with all fields over separate create + plan_quest + tag_work calls.

Not for: Do not use this for quest execution steps like starting, finishing, abandoning, or logging effort.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | attach_quest_to_questline, create_quest, create_questline, detach_quest_from_questline, dismiss_rumor, reopen_rumor, settle_rumor, update_rumor. Action to perform. |
| questId | integer | no | Quest to attach or detach. |
| questlineId | integer | no | Questline that should receive the quest. |
| quest | object | no |  |
| questline | object | no |  |
| rumorId | integer | no | Rumor to settle, dismiss, or reopen. |
| dismissedAt | integer | no | Optional dismissal timestamp. |
| settledAt | integer | no | Optional settlement timestamp. |
| quests | array | no | Quests to create during rumor settlement. Include timing and tags directly. |
| now | integer | no | Optional timestamp for membership, reopen, or rumor update. |
| title | string | no | New title for the update_rumor action. |
| details | string | no | New or enriched context text for the update_rumor action. |

### plan_quest

Refine a quest by revising its objective before actual start or by changing its temporal planning fields.

Use when: Use this when you need to sharpen what the quest means or how it is timed without starting or resolving it.

Not for: Do not use this for lifecycle execution such as start, finish, abandon, or effort logging.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | revise_objective, set_time. Action to perform. |
| questId | integer | yes | The quest to refine. |
| objective | string | no | The new quest objective text. Required for revise_objective. |
| notBeforeAt | integer | no | Optional earliest actionable timestamp. |
| dueAt | integer | no | Optional latest acceptable completion timestamp. |
| scheduledStartAt | integer | no | Optional planned schedule window start. |
| scheduledEndAt | integer | no | Optional planned schedule window end. |
| allDay | boolean | no | Whether the planned schedule window is all-day. |
| estimateSeconds | integer | no | Optional active-effort estimate in seconds. |
| now | integer | no | Optional update timestamp. |

### run_quest

Run quest lifecycle actions such as starting, logging effort, finishing, abandoning, or abandoning and spawning follow-up quests atomically.

Use when: Use this for actual execution lifecycle steps after the quest already exists.

Not for: Do not use this for work shaping, planning-only edits, tagging, or rewards.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | start, log_effort, finish, abandon, abandon_and_spawn_followups. Action to perform. |
| questId | integer | yes | Quest whose execution state should change. |
| startedAt | integer | no | Optional start timestamp for the start action. |
| force | boolean | no | Start despite unmet unlock prerequisites. Defaults to false. |
| effortSeconds | integer | no | Positive active-effort increment in seconds. Required for log_effort. |
| now | integer | no | Optional effort-log timestamp. |
| outcome | string | no | Terminal outcome text. Required for finish, abandon, and abandon_and_spawn_followups. |
| resolvedAt | integer | no | Optional resolved timestamp for finish or abandon actions. |
| followups | array | no | Follow-up quests to create atomically. Required for abandon_and_spawn_followups. |

### organize_work

Organize grouping and dependency structure by updating questlines or changing hard unlock prerequisites between concrete quests.

Use when: Use this when work structure or gating logic should change without changing quest execution state.

Not for: Do not use this for quest execution, planning-only edits, intake capture, or tag-like classification.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | add_unlock, archive_questline, remove_unlock, replace_unlocks, set_questline_fields. Action to perform. |
| questlineId | integer | no | Questline to update or archive. |
| title | string | no | Optional new questline title. |
| description | string | no | Optional new questline description. |
| startsAt | integer | no | Optional questline start timestamp. |
| dueAt | integer | no | Optional questline due timestamp. |
| archivedAt | integer | no | Optional archive timestamp. |
| toQuestId | integer | no | Quest whose blockers should change. |
| fromQuestId | integer | no | Prerequisite quest id. |
| fromQuestIds | array | no | Full prerequisite quest id set. |
| now | integer | no | Optional timestamp. |

### manage_repeatable

Manage recurring work definitions by creating, updating, previewing, spawning, or archiving repeatable quests.

Use when: Use this when the work is a repeatable template or when due recurring anchors need to be previewed or materialized.

Not for: Do not use this for one-off concrete quest execution, for inspecting an existing concrete quest, or for hiding a repeatable quest. Use `retire_work` for hiding.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | archive, create, preview_due, spawn_due, update. Action to perform. |
| repeatableQuestId | integer | no | Repeatable quest to archive or update. |
| repeatableQuest | object | no |  |
| title | string | no | Optional new title for the update action. |
| objective | string | no | Optional new objective for the update action. |
| questlineId | integer | no | Optional new questline id. |
| rrule | string | no | Optional new RRULE. |
| anchorAt | integer | no | Optional new recurrence anchor timestamp. |
| notBeforeOffsetSeconds | integer | no | Optional new not-before offset in seconds. |
| dueOffsetSeconds | integer | no | Optional new due offset in seconds. |
| scheduledStartOffsetSeconds | integer | no | Optional new scheduled-start offset in seconds. |
| scheduledEndOffsetSeconds | integer | no | Optional new scheduled-end offset in seconds. |
| allDay | boolean | no | Whether future schedules are all-day. |
| estimateSeconds | integer | no | Optional new effort estimate. |
| archivedAt | integer | no | Optional archive timestamp. |
| now | integer | no | Evaluation or update timestamp. |

### tag_work

Classify work by adding, removing, or replacing tags on quests and by replacing the future tag template set on repeatable quests.

Use when: Use this when you want classification, reporting, or saved-filter semantics rather than lifecycle or dependency semantics.

Not for: Do not use tags to model status, time planning, or hard prerequisites.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | add, remove, replace. Action to perform. |
| target | object | yes |  |
| tagNames | array | yes | Tag names to add, remove, or replace. |
| now | integer | no | Optional timestamp for the tag mutation. |

### reward_work

Manage rewards by adding, updating, removing, or claiming quest rewards, or by replacing future reward templates on repeatable quests.

Use when: Use this when a completed or recurring piece of work should grant or update reward information.

Not for: Do not use this to finish quests themselves or to model dependencies, classification, or scheduling.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | add, claim, remove, replace_repeatable_template, update. Action to perform. |
| target | object | yes |  |
| reward | object | no |  |
| rewards | array | no | Full future reward template set. Required for replace_repeatable_template. |
| claimedAt | integer | no | Optional claim timestamp. |
| now | integer | no | Optional timestamp for removal or template replacement. |

### retire_work

Hide an item from normal active operation without rewriting history by soft-deleting a rumor, quest, questline, or repeatable quest.

Use when: Use this when work should disappear from active reads while preserving historical truth.

Not for: Do not use this when you mean to archive a questline or repeatable quest while keeping it visible as retired structure.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | hide. The retirement action to perform. |
| target | object | yes | The target to hide. |
| deletedAt | integer | no | Optional timestamp to record when the item became hidden. |

### Workflow guides

- [archive-delete-and-prune](references/archive-delete-and-prune.md): Choose the right retirement action for each kind of work so history stays honest and hiding does not get confused with archival or terminal execution truth.
- [choose-work-shape](references/choose-work-shape.md): Choose the right structure for new work by separating uncertainty, one-shot execution, multi-step arcs, and recurring patterns.
- [clarify-ambiguous-requests](references/clarify-ambiguous-requests.md): Treat ambiguity as a real state, capture uncertainty honestly, and only commit work structure once the next executable shape is clear.
- [close-work-and-claim-outcomes](references/close-work-and-claim-outcomes.md): Close work with the correct terminal lifecycle action, then handle any concrete reward claim as a separate explicit step.
- [create-concrete-quest](references/create-concrete-quest.md): Create real, bounded executable quests only when the objective is concrete enough to execute without interpretive guesswork.
- [detect-slips-and-staleness](references/detect-slips-and-staleness.md): Detect work that is slipping or going stale by reading overdue, deferred, in-progress, and related operational views before choosing one recovery move.
- [escalate-and-unblock](references/escalate-and-unblock.md): Diagnose blockers honestly, then remove or realign hard gates when the model is wrong instead of treating every delay as generic escalation theater.
- [frame-initiative-questline](references/frame-initiative-questline.md): Use questlines for shared initiative context, then attach concrete quests and maintain the structure without confusing one quest with one arc.
- [handle-exceptions-and-weird-cases](references/handle-exceptions-and-weird-cases.md): Handle weird cases by diagnosing the actual tool outcome, routing into clarification or recovery when needed, and refusing to fake a clean normal-state story.
- [intake-triage](references/intake-triage.md): Triage new asks, ideas, and vague incoming work into the right next step without prematurely committing execution structure.
- [maintain-clear-ownership](references/maintain-clear-ownership.md): Keep ownership explicit through quest content and classification because Questlog does not provide a separate assignee field or ownership tool.
- [manage-approvals-and-promises](references/manage-approvals-and-promises.md): Treat approvals and commitments as modeled work with timing and dependencies instead of burying them as vague narrative promises.
- [plan-successor-work](references/plan-successor-work.md): Create explicit successor work after closure by spawning follow-ups or shaping new work, while keeping uncertain next steps in intake instead of faking certainty.
- [plan-time-correctly](references/plan-time-correctly.md): Use quest planning fields honestly so availability, due pressure, and schedule intent stay meaningful instead of getting collapsed into one generic date.
- [prioritize-across-streams](references/prioritize-across-streams.md): Prioritize across competing work streams by reading real candidate sets, distinguishing available from blocked work, and then reflecting the choice in planning.
- [protect-capacity-and-focus](references/protect-capacity-and-focus.md): Protect capacity and focus by reading the real in-progress and scheduled-now load, then using planning to rebalance instead of silently overcommitting.
- [recover-from-modeling-mistakes](references/recover-from-modeling-mistakes.md): Recover from modeling mistakes by diagnosing the exact current state first, then applying the smallest honest corrective tool instead of rewriting history blindly.
- [report-status-and-manage-expectations](references/report-status-and-manage-expectations.md): Build status reporting from the real questlog state, separating available, blocked, in-progress, slipping, and resolved work without relying on memory.
- [revise-or-reshape-commitment](references/revise-or-reshape-commitment.md): Revise a quest objective before execution starts, but reshape commitments honestly with lifecycle tools once real execution history exists.
- [run-operational-review](references/run-operational-review.md): Drive daily or weekly operational review from structured list views, then move from diagnosis into actual planning or execution changes.
- [run-recurring-rhythms](references/run-recurring-rhythms.md): Model recurring work as repeatable definitions that spawn fresh concrete quests over time instead of living forever as one immortal task.
- [search-and-retrieve-context](references/search-and-retrieve-context.md): Find relevant questlog context quickly, then switch from discovery to exact inspection without confusing free-text search with structured review surfaces.
- [sequence-with-unlocks](references/sequence-with-unlocks.md): Model hard sequencing with unlocks between concrete quests so blocked and available work stay truthful and reviewable.
- [settle-rumor-into-structure](references/settle-rumor-into-structure.md): Turn a ready rumor into committed quest or questline structure without losing provenance or pretending vague intake is settled.
- [tag-and-filter-portfolios](references/tag-and-filter-portfolios.md): Use tags for cross-cutting classification and portfolio filtering without confusing tags for status, timing, or dependency modeling.

### Principles

- Store the least committed truth first.
- Read before you prescribe.
- Protect history when reality changes.
- Close the last mile, not just the main work.

## Without the binary

Use `npx -y @ghostpaw/questlog ...` in npm-based environments (Node 24+). Harnesses that embed it in code can import `@ghostpaw/questlog` as a library.
