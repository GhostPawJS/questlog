---
name: revise-or-reshape-commitment
description: Handle scope change without corrupting execution truth. Use when a quest objective changed, was modeled badly, or should be replaced with a different work shape.
---

# Revise Or Reshape Commitment

## Instructions

1. First check whether execution already started with `getQuestDetail(db, questId, now?)`.
2. If the quest has not started, use `reviseQuestObjective(db, questId, objective, now?)` for narrow objective edits.
3. If execution has started, do not rewrite history. Choose a reshaping move instead:
   - finish it if the original commitment was completed
   - abandon it if reality changed
   - create follow-up work for the new shape
4. If the quest belongs elsewhere, move or detach it from the questline rather than editing text to imply structure.
5. If the entire model shape was wrong, hand off to `recover-from-modeling-mistakes`.

## Failure Paths

- If post-start scope changed materially, use `abandonQuestAndSpawnFollowups(...)` or `abandonQuest(...)` plus new quests.
- If the original objective was already achieved, finish it and create successor work instead of mutating the old record.
- If you cannot tell whether this is a wording fix or a new commitment, default to preserving history.

## Do Not

- use `reviseQuestObjective()` after real execution began
- rewrite one quest so it silently becomes a different quest
- treat restructuring as a cosmetic edit
