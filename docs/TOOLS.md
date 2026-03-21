# Tool Guidance

This document is the single source of truth for Questlog's LLM-facing tool
surface.

The core rule is simple:

LLM tools are agent-facing contracts, not ordinary developer APIs.

A good tool should make four things cheap for the model:

- choosing the right tool
- filling the right arguments
- understanding the result
- recovering after failure or ambiguity

## Design Principles

### Shape Tools Around Intent

Prefer user-meaningful actions over thin CRUD wrappers.

Good:

- `search_questlog`
- `capture_rumor`
- `shape_work`

Bad:

- `get_rumor_row`
- `update_quest_status`
- `create_repeatable_row`

The surface should match how a human would describe the task, not how storage is
organized.

### Keep The Set Small And Distinct

Too many similar tools increase:

- wrong tool selection
- hesitation between near-duplicates
- argument confusion
- token cost from loading definitions

Consolidate adjacent operations when one tool can express the workflow cleanly.

### Make Selection Obvious

Every tool definition should make clear:

- what it does
- when to use it
- when not to use it
- whether it reads or writes
- what comes back
- what to do next after success or failure

Descriptions should read like guidance for a capable but overloaded new hire.

## Input Rules

### Keep Schemas Strict

Default to:

- explicit `required` fields
- enums for closed choices
- `additionalProperties: false`
- precise field descriptions
- explicit optionality instead of vague omission

If a field is needed for correct execution, require it.

### Prefer Unequivocal Parameters

Avoid:

- overlapping fields
- generic names like `data`, `value`, or `options`
- several ways to express the same choice
- opaque IDs without enough human context

Prefer concrete names like `dueAt`, `objective`, `resolvedAt`, or
`detailLevel`.

### Do Not Pressure The Model To Guess

If the request is valid but underdetermined, return clarification instead of
forcing invented values.

If the request is malformed, return an error instead of clarification.

## Output Rules

### Return Results The Model Can Act On

A good result contains:

- the key outcome
- stable top-level structure
- meaningful refs or identifiers
- relevant derived state
- only the most useful next-step context

Avoid giant raw dumps when a purpose-shaped summary is enough.

### Prefer Predictable Shapes

Structured outputs should stay stable across tools:

- fixed top-level fields
- consistent naming
- machine-readable edge cases
- optional prose only as a supplement

### Make Errors Recovery-Oriented

Tool failures should be:

- specific
- actionable
- honest about what failed
- easy to branch on mechanically

Separate:

- protocol errors: malformed or unsupported calls
- domain errors: valid call, blocked by rules or current state
- system errors: unexpected failure

That distinction tells the model whether to fix arguments, choose a different
action, or retry later.

## Context And Evaluation

Definitions and outputs both consume context, so keep them tight:

- avoid redundant prose
- avoid duplicate tools
- paginate or filter large reads
- default to compact outputs
- allow parallel safe reads when no dependency exists

Tool quality must be evaluated against realistic prompts, ambiguities, and
mistakes. Transcript review is mandatory.

## Questlog Tool Contract

Questlog's LLM surface lives in `src/tools/`.

This facade is additive. It does not replace the lower-level domain API in
`src/read.ts`, `src/write.ts`, and top-level exports. It packages the same model
semantics into a smaller runtime-ready tool surface for LLM runtimes.

### Runtime Definition Shape

Each tool exports:

- an input type
- a result type
- a plain TypeScript handler
- a runtime-ready metadata object

The shared metadata type lives in `src/tools/tool_metadata.ts`.

Each runtime definition includes:

- `name`
- `description`
- `whenToUse`
- `whenNotToUse`
- `sideEffects`
- `readOnly`
- `supportsClarification`
- `targetKinds`
- `inputDescriptions`
- `outputDescription`
- `inputSchema`
- `handler`

That makes the same definition directly consumable by OpenAI tool adapters, MCP
adapters, or other runtime wiring without comment scraping.

### Registry And Mapping

The canonical registry lives in `src/tools/tool_registry.ts` as
`questlogTools`.

It also exports:

- `listQuestlogToolDefinitions()`
- `getQuestlogToolByName()`

The public API reconciliation table lives in `src/tools/tool_mapping.ts` as
`questlogToolMappings`.

### Result Contract

Every Questlog tool returns structured data, including non-happy paths.

Shared result types live in `src/tools/tool_types.ts` and use four outcomes:

- `success`
- `no_op`
- `needs_clarification`
- `error`

Failures also distinguish:

- `error.kind: "protocol"`
- `error.kind: "domain"`
- `error.kind: "system"`

Clarification is for valid-but-underdetermined requests, not malformed input.

### Output Shaping Conventions

Questlog's surface prefers purpose-shaped payloads over raw rows.

Current conventions:

- list tools return compact `items`
- `inspect_questlog_item` defaults to `detailLevel: "compact"`
- `inspect_questlog_item` supports `detailLevel: "full"` when needed
- multi-action write tools expose `primary`, `created`, and `updated` refs when
  that removes ambiguity
- results may include `warnings`, `entities`, and `next` hints when helpful

Compact inspect is the default because it is usually the right trade-off for an
LLM turn.

### Current Clarification Branches

High-value clarification behavior currently includes:

- `search_questlog` with `mode: "identify_one"` when several matches are
  plausible
- `review_questlog` for `quests.scheduled_for_day` when `filters.dayAt` is
  missing
- `shape_work` when settling a rumor without saying whether to create a
  questline, quests, or both

Other tools should still prefer explicit error or no-op results when the input
is not actually underdetermined.

### Current Tool Set

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
- you want runtime metadata plus strict schemas
- you want structured `no_op`, clarification, and error results
- you want the smaller workflow-first surface

Use the lower-level domain API when:

- you need exact fine-grained reads or writes directly
- you are implementing Questlog internals
- you are working below the LLM integration layer

## Boundary Notes

- `manage_repeatable` owns repeatable definition lifecycle and materialization
- `retire_work` owns canonical hiding across supported entity kinds
- hiding repeatable quests is intentionally routed through `retire_work`

## Review Checklist

Before adding or changing a tool, check:

1. Is it shaped around a real user intent?
2. Is its name unambiguous next to every other tool?
3. Does its description clearly say when to use it and when not to?
4. Are required fields truly required?
5. Are optional fields genuinely optional?
6. Are outputs compact, stable, and useful for the next step?
7. Are errors actionable and clarification branches honest?
8. Are side effects and boundaries explicit?
9. Is the token footprint justified?
10. Is the behavior backed by tests and transcript review?
