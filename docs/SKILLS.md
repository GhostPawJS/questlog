# Skills

Questlog ships a built-in runtime skill surface under `src/skills/`.

These skills exist so agent harnesses do not have to invent every complex
task-management or calendar-management workflow from scratch. The library
already includes reusable guidance for common operational scenarios, and that
guidance can be loaded directly at runtime.

## What A Skill Is

A Questlog skill is a plain runtime object that describes a reusable operating
pattern for using Questlog well.

Skills are meant to cover the kinds of multi-step situations that show up
constantly in real task and calendar systems, such as:

- triaging vague incoming work
- choosing the right work shape
- planning and sequencing execution
- handling recurring rhythms
- reporting status honestly
- recovering from ambiguity, blockers, or modeling mistakes

They are designed to be exposed directly to agent runtimes as part of the
library's built-in guidance layer.

Each skill exports:

- `name`
- `description`
- `content`

The shared type lives in `src/skills/skill_types.ts`:

```ts
interface QuestlogSkill {
  name: string;
  description: string;
  content: string;
}
```

`content` is the actual skill body. It teaches:

- which tools from `src/tools/` to use
- how to sequence them
- how to interpret outcomes
- how to handle edge cases, no-ops, clarifications, and failures

## Runtime Surface

The runtime barrel is `src/skills/index.ts`.

It exports:

- every individual skill object
- `questlogSkills`: the canonical registry array
- `listQuestlogSkills()`: returns a copy of the registry
- `getQuestlogSkillByName()`: lookup by runtime skill name
- `defineQuestlogSkill()`: identity helper for authoring skills

The registry itself lives in `src/skills/skill_registry.ts`.

## How To Use The Skills Surface

Use `src/skills/` when you want:

- a runtime-loadable skill catalog for an agent or LLM harness
- stable names and descriptions for selection or discovery
- embedded longform operational guidance in `content`
- built-in references to the convenience tool facade in `src/tools/`
- behavior backed by colocated integration tests

Typical usage flow:

1. Load `questlogSkills` or call `listQuestlogSkills()`.
2. Select a skill by `name` or by matching `description`.
3. Provide the skill `content` to your agent/runtime as operational guidance.
4. Execute the referenced tools from `src/tools/`.

## Available Skills

- `archive-delete-and-prune`: Choose the right retirement action for each kind of work so history stays honest and hiding does not get confused with archival or terminal execution truth.
- `choose-work-shape`: Choose the right structure for new work by separating uncertainty, one-shot execution, multi-step arcs, and recurring patterns.
- `clarify-ambiguous-requests`: Treat ambiguity as a real state, capture uncertainty honestly, and only commit work structure once the next executable shape is clear.
- `close-work-and-claim-outcomes`: Close work with the correct terminal lifecycle action, then handle any concrete reward claim as a separate explicit step.
- `create-concrete-quest`: Create real, bounded executable quests only when the objective is concrete enough to execute without interpretive guesswork.
- `detect-slips-and-staleness`: Detect work that is slipping or going stale by reading overdue, deferred, in-progress, and related operational views before choosing one recovery move.
- `escalate-and-unblock`: Diagnose blockers honestly, then remove or realign hard gates when the model is wrong instead of treating every delay as generic escalation theater.
- `frame-initiative-questline`: Use questlines for shared initiative context, then attach concrete quests and maintain the structure without confusing one quest with one arc.
- `handle-exceptions-and-weird-cases`: Handle weird cases by diagnosing the actual tool outcome, routing into clarification or recovery when needed, and refusing to fake a clean normal-state story.
- `intake-triage`: Triage new asks, ideas, and vague incoming work into the right next step without prematurely committing execution structure.
- `maintain-clear-ownership`: Keep ownership explicit through quest content and classification because Questlog does not provide a separate assignee field or ownership tool.
- `manage-approvals-and-promises`: Treat approvals and commitments as modeled work with timing and dependencies instead of burying them as vague narrative promises.
- `plan-successor-work`: Create explicit successor work after closure by spawning follow-ups or shaping new work, while keeping uncertain next steps in intake instead of faking certainty.
- `plan-time-correctly`: Use quest planning fields honestly so availability, due pressure, and schedule intent stay meaningful instead of getting collapsed into one generic date.
- `prioritize-across-streams`: Prioritize across competing work streams by reading real candidate sets, distinguishing available from blocked work, and then reflecting the choice in planning.
- `protect-capacity-and-focus`: Protect capacity and focus by reading the real in-progress and scheduled-now load, then using planning to rebalance instead of silently overcommitting.
- `recover-from-modeling-mistakes`: Recover from modeling mistakes by diagnosing the exact current state first, then applying the smallest honest corrective tool instead of rewriting history blindly.
- `report-status-and-manage-expectations`: Build status reporting from the real questlog state, separating available, blocked, in-progress, slipping, and resolved work without relying on memory.
- `revise-or-reshape-commitment`: Revise a quest objective before execution starts, but reshape commitments honestly with lifecycle tools once real execution history exists.
- `run-operational-review`: Drive daily or weekly operational review from structured list views, then move from diagnosis into actual planning or execution changes.
- `run-recurring-rhythms`: Model recurring work as repeatable definitions that spawn fresh concrete quests over time instead of living forever as one immortal task.
- `search-and-retrieve-context`: Find relevant questlog context quickly, then switch from discovery to exact inspection without confusing free-text search with structured review surfaces.
- `sequence-with-unlocks`: Model hard sequencing with unlocks between concrete quests so blocked and available work stay truthful and reviewable.
- `settle-rumor-into-structure`: Turn a ready rumor into committed quest or questline structure without losing provenance or pretending vague intake is settled.
- `tag-and-filter-portfolios`: Use tags for cross-cutting classification and portfolio filtering without confusing tags for status, timing, or dependency modeling.

## Quality Bar

Every runtime skill has a colocated `*.test.ts` scenario test in `src/skills/`.
Those tests exercise the real tool facade and cover happy paths, edge cases,
clarifications, no-ops, and failures so the shipped skill guidance stays
executable rather than drifting into prose-only advice.
