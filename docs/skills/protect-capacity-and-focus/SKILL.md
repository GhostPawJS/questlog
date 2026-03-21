---
name: protect-capacity-and-focus
description: Protect throughput by managing overload, WIP sprawl, interruptions, and meeting drag. Use when busyness is masking poor prioritization, weak focus, or collapsing execution quality.
---

# Protect Capacity And Focus

## Instructions

1. Inspect live work volume with:
   - `listActiveQuests(...)`
   - `listInProgressQuests(...)`
   - `listScheduledNow(...)`
   - `listMissedScheduledQuests(...)`
2. Reduce concurrency before adding more work. Prefer fewer active quests that can finish.
3. Use `planQuestTime(...)` and `notBeforeAt` to protect attention from premature work.
4. Move lower-value work out of immediate competition instead of letting everything stay “active.”
5. Review recurring and stakeholder work separately so meetings and interruptions do not silently consume the whole week.

## Failure Paths

- If calendars are full but nothing is finishing, assume overload rather than poor motivation.
- If many quests are scheduled now, the plan is too dense; rebalance it.
- If interruption-heavy work keeps winning, reprioritize explicitly instead of letting chat decide the portfolio.

## Do Not

- mistake busyness for throughput
- keep every maybe-important item active at once
- use meetings as a substitute for clear state in Questlog
