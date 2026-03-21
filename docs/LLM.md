# LLM Building Blocks

Questlog is designed to work well in two modes at once:

- as a clean direct-code library for human developers
- as a runtime surface that agent harnesses can wire into LLM systems directly

The core idea is simple:

LLMs need more than callable functions. They need a shaped way to think, a
small action surface, and reusable guidance for common multi-step situations.

Questlog therefore exposes three AI-oriented building blocks, top to bottom:

1. soul
2. tools
3. skills

The lower layers are still useful on their own, but together they form a clean
stack for reliable LLM behavior.

## Runtime Surfaces

The AI-facing runtime surfaces are all exported directly from the library:

- `src/soul.ts`: thinking foundation
- `src/tools/`: action surface
- `src/skills/`: reusable workflow guidance

At the package root, they are grouped as sibling namespaces:

```ts
import { skills, soul, tools } from '@ghostpaw/questlog';
```

## Soul

The soul is the thinking foundation.

It does not define what the model can do. It defines how the model should see
the domain, which boundaries it should protect, and what kind of judgment it
should apply before touching state.

Questlog exports this foundation through the root `soul` namespace:

- `soul.questlogSoul`
- `soul.questlogSoulEssence`
- `soul.questlogSoulTraits`
- `soul.renderQuestlogSoulPromptFoundation()`

The runtime soul shape is:

```ts
interface QuestlogSoul {
  slug: string;
  name: string;
  description: string;
  essence: string;
  traits: readonly {
    principle: string;
    provenance: string;
  }[];
}
```

The current soul is `Steward`, with the slug `steward`.

Its job is to keep the system's representation of work trustworthy over time.
That means:

- uncertainty should not be prematurely turned into commitments
- derived state should be read before intervention
- history should not be rewritten once execution has begun
- closure should include the real last mile, not just the main work

In practice, the soul is the best foundation for a system prompt or agent role
prompt. It gives the model the right operational instincts before any tool call
happens.

The currently exported principles are:

- store the least committed truth first
- read before you prescribe
- protect history when reality changes
- close the last mile, not just the main work

## Tools

The tools are the action surface.

Questlog exposes a dedicated LLM-oriented tool facade under `src/tools/`. This
surface is additive: it does not replace the lower-level domain API, but it
packages Questlog into a smaller, clearer, runtime-ready contract for agent
systems. The count is deliberately small — [tool selection accuracy degrades
sharply past a modest
count](https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools), so
Questlog keeps the total at 12.

Each tool exports:

- a plain TypeScript handler
- runtime metadata
- strict input descriptions and JSON-schema-compatible input shape
- structured machine-readable results

The shared runtime tool definition shape is:

```ts
interface QuestlogToolDefinition<TInput, TResult> {
  name: string;
  description: string;
  whenToUse: string;
  whenNotToUse?: string;
  sideEffects: "none" | "writes_state";
  readOnly: boolean;
  supportsClarification: boolean;
  targetKinds: readonly string[];
  inputDescriptions: Record<string, string>;
  outputDescription: string;
  inputSchema: JsonSchema;
  handler: (db: QuestlogDb, input: TInput) => TResult;
}
```

The canonical registry lives in `src/tools/tool_registry.ts` and is surfaced at
the package root through `tools`:

- `tools.questlogTools`
- `tools.listQuestlogToolDefinitions()`
- `tools.getQuestlogToolByName()`

The public API reconciliation table is exported from `src/tools/tool_mapping.ts`
as `tools.questlogToolMappings`.

The tool layer is designed to make four things cheap for the model:

- choosing the right tool
- filling the right arguments
- understanding the result
- recovering from errors or ambiguity

Questlog's tool results use a consistent outcome contract:

- `success`
- `no_op`
- `needs_clarification`
- `error`

That keeps strange cases explicit instead of forcing an LLM adapter to infer
intent from thrown exceptions or vague prose.

Failures also distinguish:

- `error.kind: "protocol"`
- `error.kind: "domain"`
- `error.kind: "system"`

Questlog tools prefer purpose-shaped output rather than raw row dumps. Common
conventions include:

- compact list `items`
- compact-by-default inspection with optional full detail
- `primary`, `created`, and `updated` refs for multi-action writes
- `warnings`, `entities`, and `next` hints when they reduce ambiguity

The current tool set is:

- `search_questlog`
- `review_questlog`
- `inspect_questlog_item`
- `capture_rumor`
- `shape_work`
- `plan_quest`
- `run_quest`
- `organize_work`
- `manage_repeatable`
- `tag_work`
- `reward_work`
- `retire_work`

These tools are intentionally shaped around user intent rather than raw storage
operations. They are the layer an agent should execute against.

## Skills

The skills are the workflow layer.

Questlog ships a built-in runtime skill surface under `src/skills/`. These
skills describe reusable operating patterns for common task-management and
calendar-management situations.

Where the soul says how to think, and the tools define what actions are
available, the skills describe how to combine those actions well in recurring
real-world scenarios.

Each skill exports:

- `name`
- `description`
- `content`

The shared runtime shape is:

```ts
interface QuestlogSkill {
  name: string;
  description: string;
  content: string;
}
```

The skill `content` references the tool facade directly and teaches:

- which tools to use
- how to sequence them
- how to interpret outcomes
- how to handle clarifications, no-ops, and failures

The registry lives in `src/skills/skill_registry.ts` and is surfaced at the
package root through `skills`:

- `skills.questlogSkills`
- `skills.listQuestlogSkills()`
- `skills.getQuestlogSkillByName()`
- `skills.defineQuestlogSkill()`

Questlog currently ships the following built-in skills:

- `archive-delete-and-prune`
- `choose-work-shape`
- `clarify-ambiguous-requests`
- `close-work-and-claim-outcomes`
- `create-concrete-quest`
- `detect-slips-and-staleness`
- `escalate-and-unblock`
- `frame-initiative-questline`
- `handle-exceptions-and-weird-cases`
- `intake-triage`
- `maintain-clear-ownership`
- `manage-approvals-and-promises`
- `plan-successor-work`
- `plan-time-correctly`
- `prioritize-across-streams`
- `protect-capacity-and-focus`
- `recover-from-modeling-mistakes`
- `report-status-and-manage-expectations`
- `revise-or-reshape-commitment`
- `run-operational-review`
- `run-recurring-rhythms`
- `search-and-retrieve-context`
- `sequence-with-unlocks`
- `settle-rumor-into-structure`
- `tag-and-filter-portfolios`

These cover recurring complex scenarios like intake, shaping, planning,
sequencing, review, recurrence, recovery, and portfolio organization. That
makes the library useful not only as a storage and behavior engine, but also as
a shipped guidance layer for agent harnesses.

## How The Layers Fit Together

A good Questlog-based LLM system typically uses the layers in this order:

1. Start from the soul so the model is primed with the right judgment style.
2. Expose the tools so the model has a clean action surface.
3. Load relevant skills so common multi-step situations do not have to be
   improvised from scratch.

That gives the system:

- a thinking posture
- an execution surface
- reusable operational playbooks
- all backed by real runtime exports instead of prose-only conventions

## Human And AI Use Together

None of this replaces the human-facing library surface.

Questlog still works as a direct-code library through its normal TypeScript API.
The soul, tools, and skills are an additional AI-oriented layer on top of that
clean core, not a fork of the system into a separate product.

That is the point of the design:

- humans get a clean library
- agents get runtime-ready guidance and execution primitives
- both operate on the same truthful underlying model
