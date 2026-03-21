---
name: archive-delete-and-prune
description: Retire work cleanly without corrupting history. Use when deciding between archive, soft delete, dismiss, abandon, or other removal-like moves for items leaving active operation.
---

# Archive Delete And Prune

## Instructions

1. Choose the retirement action by meaning, not by convenience:
   - `dismissRumor(...)` for intake that should not become work
   - `archiveQuestline(...)` for an initiative that is no longer active
   - `archiveRepeatableQuest(...)` to stop future spawns
   - `softDeleteQuest(...)`, `softDeleteRumor(...)`, `softDeleteQuestline(...)`, or `softDeleteRepeatableQuest(...)` to hide mistaken or unwanted rows from normal active reads
   - `abandonQuest(...)` for real failed or discontinued committed work
2. Preserve historical truth whenever the record reflects real execution or real management state.
3. Prefer archive for meaningful finished containers and soft delete for removal from active visibility.
4. After pruning, verify that active reads now show the intended surface.

## Failure Paths

- If the item represents real committed work that stopped, do not soft delete it just to keep history pretty.
- If a repeatable should stop generating future work but past spawned history matters, archive it instead of deleting it.
- If the real problem is stale or wrongly shaped work, hand off to the matching recovery skill.

## Do Not

- use abandon as a delete button
- archive to hide modeling mistakes
- soft delete history that should remain operationally meaningful
