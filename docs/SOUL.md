# Quest Soul And Integration

## Dedicated Quest Soul

Once the standalone faculty is accepted as the canonical quest engine, the next layer should be a focused quest-management soul with one domain only: quests.

### Soul Boundaries

- owns quest interpretation and tool use
- does not own persistence design
- does not compute availability logic itself
- does not reimplement recurrence, reward rules, or unlock rules in prompt text
- delegates zero quest work back to a generic warden

### Recommended Tool Surface

Target a small, explicit surface:

- `quest_capture_rumor`
- `quest_settle_rumor`
- `quest_create`
- `quest_plan`
- `quest_start`
- `quest_finish`
- `quest_abandon_with_followups`
- `quest_review_board`

If more tools are needed later, add them only when evidence shows a real reliability win.

### Soul Guidance

The soul prompt should emphasize:

- intake first, commitment second
- objective immutability after actual start
- follow-up spawning instead of rewriting history
- hard unlocks as true blockers
- scheduled work and due work as different truths
- rewards as descriptive attachments, not ceremony triggers

## Ghostpaw Integration Plan

### Phase 1

Keep the new faculty isolated and callable by tests and any future standalone adapter. Do not partially mix it into the old quest toolchain.

### Phase 2

Build a dedicated quest tool adapter that maps each quest-soul tool directly onto faculty operations with minimal translation:

- tool parameters should mirror faculty operations closely
- tool descriptions should encode the correct intent boundaries
- read tools should surface available, overdue, scheduled, deferred, and rumor-output views directly

### Phase 3

Remove quest responsibility from the overloaded warden surface:

- the coordinator delegates quest work to the dedicated quest soul
- persistence-heavy pack and memory work stays outside that soul
- quest delegations should carry concrete context, not vague free-form summaries

### Phase 4

Only after the dedicated soul proves reliable should any ecosystem-specific concepts be reintroduced:

- XP interpretation
- ceremony text
- autonomous embark behavior
- reward redemption effects

Those concerns should sit above the faculty boundary, never inside it.
