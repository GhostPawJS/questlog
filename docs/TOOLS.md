# Tool Design Guidance

This document defines how LLM-facing tools should be designed so models choose
them correctly, fill them correctly, recover from failure, and waste as little
context as possible.

The core rule is simple:

LLM tools are not ordinary developer APIs. They are agent-facing contracts.

That means a good tool is optimized for:

- correct selection
- correct argument filling
- low ambiguity
- low context cost
- easy recovery from mistakes
- easy interpretation of results

## What Good Tools Do

Good tools reduce mental work for the model.

They should make it obvious:

- what the tool is for
- when to use it
- when not to use it
- which arguments are required
- which values are valid
- what comes back
- what to do next after success or failure

If the model has to infer too much, the tool is badly designed.

## Prefer Intent-Shaped Tools

Do not expose thin wrappers around internal CRUD when the real task is higher
level.

Prefer:

- `search_contacts`
- `schedule_event`
- `settle_rumor`

Over:

- `get_contacts`
- `create_event_row`
- `update_rumor_status`

The best tool surface matches the way a human would describe the task, not the
way a storage layer is organized.

## Keep The Tool Set Small

Fewer well-shaped tools beat many narrow or overlapping ones.

Too many similar tools cause:

- wrong tool selection
- hesitation between near-duplicates
- extra token cost from loading definitions
- more argument confusion

Consolidate adjacent operations when one tool can safely express the full
workflow.

## Use Clear Names

Names should be concrete, literal, and easy to disambiguate.

Rules:

- prefer verbs that describe the outcome, not implementation
- use stable nouns from the domain model
- namespace when several systems or entities are present
- avoid overloaded words like `process`, `handle`, or `manage`

Examples:

- `quest_create`
- `quest_start`
- `quest_resolve`
- `rumor_settle`

## Write Descriptions For A New Hire

Tool descriptions matter as much as schemas.

Every tool description should explicitly state:

- what the tool does
- what input it expects
- when it should be used
- when it should not be used
- important side effects
- important limitations
- what the return value means

Good descriptions remove guesswork. They should answer the model's likely
confusions before they happen.

## Make Input Schemas Strict

Use structured schemas, not loose free-form argument blobs.

Strong defaults:

- mark all meaningful fields as `required`
- use enums for closed sets
- set `additionalProperties: false`
- make optionality explicit instead of vague
- constrain formats where possible
- document semantic expectations in field descriptions

If a field can be omitted, that should be a deliberate decision, not accidental
sloppiness.

## Prefer Fewer Optional Fields

Optional fields are a major source of model error.

If a value is needed for correct execution, require it.

If a value is truly optional:

- allow `null` when the platform expects explicit optionality
- explain the default behavior clearly
- avoid pairs of fields where one silently overrides the other

Do not make the model guess which missing values are acceptable.

## Make Parameter Meanings Unequivocal

Bad schemas fail even when they are technically valid.

Avoid:

- fields with overlapping meanings
- generic names like `data`, `value`, or `options`
- multiple ways to express the same choice
- raw IDs when a human-meaningful selector is more reliable

Prefer:

- `due_at` over `time`
- `resolution_note` over `message`
- `response_format` with explicit enum values over free-form verbosity flags

## Return Results The Model Can Act On

A tool result should help the next decision, not just mirror backend state.

Prefer returns that contain:

- the key outcome
- the important identifiers
- the relevant derived state
- the most important follow-up facts
- a concise summary when helpful

Avoid dumping raw rows, giant payloads, or internal-only metadata unless the
next step truly needs them.

## Prefer Meaningful Identifiers

Models reason better with human-meaningful handles than with opaque IDs alone.

When possible, return:

- titles
- names
- slugs
- timestamps with labels
- small state summaries

If you must return IDs, pair them with recognizable context.

## Design Errors For Recovery

Tool errors should help the model recover on the next turn.

Good errors are:

- specific
- actionable
- bounded
- honest about what failed

Good examples:

- "Quest not found for title `Freeze release scope`. Try `searchQuestlog()` first."
- "Cannot resolve quest because it has not been started. Use `quest_start` first."
- "Field `due_at` must be a Unix millisecond timestamp."

Bad errors:

- "invalid input"
- "failed"
- "bad request"

## Separate Protocol Errors From Domain Errors

Use protocol-level failure for malformed calls, missing required inputs, or
system failure.

Use domain-level error results for valid calls that could not be completed due
to business rules.

That distinction makes recovery easier:

- malformed call: fix the arguments
- domain rejection: choose a different action

## Be Explicit About Side Effects

If a tool changes state, say so clearly.

The description should make obvious:

- whether the tool reads or writes
- whether the change is reversible
- whether it triggers downstream effects
- whether human confirmation is required

High-risk writes should never look like harmless reads.

## Support Clarification Instead Of Guessing

A tool contract should reward the model for asking a clarifying question when
required information is missing.

Do not design tools that pressure the model to invent values just to satisfy a
schema.

If ambiguity is common, say so in the description:

- "If no clear quest is identified, ask the user which quest they mean before calling this tool."

## Optimize For Context Efficiency

Tool definitions and tool outputs both consume context.

Keep them efficient:

- avoid redundant prose
- avoid duplicate tools
- paginate large results
- support filters
- support summary vs detailed response modes
- return only the fields needed for likely next steps

For large tool libraries, do not dump every tool into context by default. Use
tool discovery, namespacing, or deferred loading.

## Support Parallel Calls When Safe

If multiple reads are independent, the tool layer should allow parallel use.

Examples:

- fetch several records
- check several statuses
- read unrelated resources

Do not force serial execution when there is no dependency.

## Prefer Predictable Output Shapes

Structured outputs are easier for models to chain than prose-only results.

When possible, make successful results stable in shape:

- fixed top-level fields
- predictable object layouts
- consistent naming across tools

Free-form narrative can be helpful as a supplement, not as the only signal.

## Design For Evaluation

Tool quality is not theoretical. It must be tested against real prompts and real
mistakes.

Evaluate at least:

- tool selection accuracy
- argument correctness
- recovery after tool errors
- behavior under ambiguity
- performance with paraphrased requests
- token cost from definitions and outputs

Transcript review is mandatory. The fastest way to improve a tool is to inspect
where the model hesitated, guessed, or used the wrong field.

## Common Failure Modes

The biggest recurring mistakes are:

- too many overlapping tools
- vague tool names
- short or underspecified descriptions
- loose schemas with many optional fields
- giant raw outputs
- opaque error messages
- hidden side effects
- requiring cryptic IDs too early
- loading huge tool catalogs into context unnecessarily

## Review Checklist

Before adding or shipping a tool, check:

1. Is this tool shaped around an actual user intent?
2. Is its name unambiguous next to every other tool?
3. Does the description explain when to use it and when not to?
4. Are required fields truly required?
5. Are optional fields genuinely optional?
6. Are enums and schema constraints used wherever possible?
7. Does the result contain the minimum useful next-step context?
8. Are errors actionable and recovery-oriented?
9. Are side effects and safety boundaries explicit?
10. Is the token footprint justified?
11. Has the tool been evaluated against realistic prompts and failures?

## Practical Default

If in doubt, design the tool so that a capable but overloaded new operator could
use it correctly with no hidden assumptions.

That is also the shape most LLMs use best.

## Questlog Runtime Pattern

In this repo, LLM-facing tools should not exist only as handler functions plus
JSDoc.

Each tool should export a runtime-ready definition object that includes:

- `name`
- `description`
- `whenToUse`
- `whenNotToUse`
- `sideEffects`
- `readOnly`
- `supportsClarification`
- `targetKinds`
- `inputDescriptions`
- `inputSchema`
- `outputDescription`
- `handler`

That makes the tool metadata directly consumable by downstream LLM runtimes
without comment scraping.

Questlog tools should also always return structured result data, including
non-happy paths:

- `success`
- `no_op`
- `needs_clarification`
- `error`

That keeps weird cases explicit and keeps recovery logic machine-readable.

Questlog failure results should also distinguish:

- `error.kind: "protocol"` for malformed or unsupported calls
- `error.kind: "domain"` for valid calls blocked by current state or rules
- `error.kind: "system"` only for unexpected failures

Questlog clarification results should be used for valid-but-underdetermined
requests, not for malformed input.

Questlog tool inputs should also export JSON-Schema-compatible runtime shape so
adapters can map the same definition into OpenAI tools, MCP tools, or similar
surfaces without rebuilding schemas from TypeScript comments.
