---
name: plan-successor-work
description: Create the next concrete work after completion, failure, or phase change. Use when ending one quest should immediately produce follow-up quests, a new arc, or a changed next step.
---

# Plan Successor Work

## Instructions

1. Ask what should happen immediately after this quest ends.
2. If failure or invalidation caused the new path, prefer `abandonQuestAndSpawnFollowups(db, questId, outcome, followups, resolvedAt?)`.
3. If success creates the next phase, use `finishQuest(db, questId, outcome, resolvedAt?)` and then `createQuest(db, input)` or `createQuestline(db, input)` for the next work.
4. Keep successor quests concrete. Do not hide a new phase inside the old quest’s outcome text.
5. Preserve provenance where it matters by linking follow-on work into the same questline or keeping the narrative in outcomes.

## Failure Paths

- If the next work is still unclear, capture it as a rumor rather than inventing fake follow-ups.
- If many follow-ups share one new initiative frame, create or update a questline instead of spawning loose quests.
- If the successor is really recurring, switch to a repeatable quest rather than manually cloning future work.

## Do Not

- leave obvious next work only in prose
- rewrite a finished quest to represent the next phase
- use follow-up spawning for cosmetic cleanup tasks that are not real commitments
