# Quest Faculty Reward Model

Rewards are generic descriptive records. The faculty stores them but does not interpret them as game mechanics.

## Concrete Quest Rewards

Each `quest_reward` belongs to exactly one concrete quest and carries:

- `kind`
- `name`
- `description`
- `quantity`
- `claimed_at`

Rules:

- rewards can be added and revised while unclaimed
- claiming is only allowed after successful quest resolution
- claimed rewards cannot be removed or claimed twice

## Repeatable Reward Templates

Each `repeatable_quest_reward` belongs to exactly one repeatable quest definition.

Rules:

- templates are copied into newly spawned concrete quests
- editing a repeatable template never rewrites already spawned quest rewards
- the faculty preserves provenance through the spawned quest, not through reward-level cross-links

## Why Generic

Reward semantics differ by app. The faculty’s job is to preserve intent and claim state, not to hardcode XP, currency, streaks, or inventory behavior.
