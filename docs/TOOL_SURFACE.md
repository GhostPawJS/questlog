# Tool Surface

Questlog now exposes an additive LLM-oriented facade under `src/tools/`.

This layer does not replace the lower-level public API in `src/read.ts`,
`src/write.ts`, and the top-level exports. It packages the same model semantics
into a smaller runtime-ready tool surface that is easier to wire into LLM
runtimes.

## Design Goal

The tool facade exists to make three things easy at the same time:

- choosing the right tool
- filling the right arguments
- interpreting the result without guesswork

That is why each tool file exports:

- an input type
- a result type
- a plain TypeScript handler function
- a runtime-ready metadata object with `name`, `description`,
  `whenToUse`, `whenNotToUse`, `inputDescriptions`,
  `outputDescription`, `inputSchema`, `sideEffects`, `readOnly`,
  `supportsClarification`, and `targetKinds`

## Runtime Shape

The shared metadata type lives in `src/tools/tool_metadata.ts`.

Each tool definition follows this shape:

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

The registry lives in `src/tools/tool_registry.ts` as `questlogTools`.

It also exports:

- `listQuestlogToolDefinitions()`
- `getQuestlogToolByName()`

Those helpers are meant for downstream adapter wiring.

The public API reconciliation table lives in `src/tools/tool_mapping.ts` as an
integrator aid when mapping lower-level calls onto the LLM-oriented surface.

## Result Contract

Every exported tool returns structured data, including failures.

The shared result contract lives in `src/tools/tool_types.ts` and uses four
outcomes:

- `success`
- `no_op`
- `needs_clarification`
- `error`

That keeps weird cases machine-readable and recovery-friendly instead of forcing
callers to parse thrown exceptions.

Failures also include:

- `error.kind`: `protocol`, `domain`, or `system`
- `error.code`: normalized machine-readable error code
- `error.recovery`: actionable retry guidance when available

Clarifications include:

- one clear question
- explicit missing or ambiguous fields
- optional enumerated choices

That means adapters can distinguish malformed calls from valid-but-impossible
calls, and can route clarification turns without string parsing.

## Output Shape

The facade now prefers purpose-shaped payloads over raw row dumps.

- list-oriented tools return compact `items`
- `inspect_questlog_item` defaults to `detailLevel: "compact"`
- `inspect_questlog_item` supports `detailLevel: "full"` when needed
- multi-action write tools increasingly expose `primary`, `created`, and
  `updated` refs to reduce follow-up ambiguity

Compact inspect is the default because it is usually the right trade-off for
LLM turns.

## Clarification Behavior

Clarification is no longer just theoretical in the shared types.

Current high-value clarification branches include:

- `search_questlog` with `mode: "identify_one"` when several matches are
  plausible
- `review_questlog` for `quests.scheduled_for_day` when `filters.dayAt` is
  missing
- `shape_work` when settling a rumor without saying whether to create a
  questline, quests, or both

Other tools still prefer explicit error or no-op behavior when the input is not
actually underdetermined.

## Current Tool Set

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

## When To Use Which Surface

Use `src/tools/` when:

- wiring Questlog into an LLM runtime
- you want exported runtime metadata plus strict input schemas
- you want a smaller workflow-first surface
- you want structured no-op, clarification, and error results
- you want adapter-friendly registry helpers and mapping guidance

Use the lower-level domain API when:

- you need the exact fine-grained write or read calls directly
- you are implementing or extending Questlog internals
- you are working below the LLM integration layer

## Boundary Notes

After the reliability pass, hiding repeatable quests is intentionally routed
through `retire_work`.

`manage_repeatable` owns repeatable definition lifecycle and materialization.
`retire_work` owns canonical hiding across all supported entity kinds.
