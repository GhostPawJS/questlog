---
name: prioritize-across-streams
description: Decide what should happen first across competing work streams. Use when multiple valid tasks, initiatives, or stakeholder demands compete for limited attention and a manager must choose explicitly.
---

# Prioritize Across Streams

## Instructions

1. Pull the real candidate set from reads, not memory:
   - `listAvailableQuests(db, filters?, now?)`
   - `listDueSoonQuests(db, horizonMs, filters?, now?)`
   - `listBlockedQuests(db, filters?, now?)`
   - `listQuestlines(db, now?)`
2. Compare candidates on real factors: deadline pressure, external commitment, unblock value, risk, and cost of delay.
3. Prefer work that unlocks other work, prevents deadline failure, or reduces risk across multiple items.
4. Use tags or questline filters to compare one stream against another cleanly.
5. Once the choice is made, make it visible by scheduling, deferring, or explicitly leaving lower-priority work unscheduled.

## Failure Paths

- If everything looks urgent, separate external deadlines from internal preference.
- If the top choice is blocked, shift to the unblock path instead of pretending it is executable.
- If a “priority” depends on hidden approval or dependency risk, hand off to the matching skill before committing.

## Do Not

- prioritize by loudest requester alone
- compare blocked and available work as if they are equal options
- hide prioritization decisions in chat without changing the system state
