---
name: recover-from-modeling-mistakes
description: Repair bad structure decisions without corrupting system truth. Use when a rumor, quest, questline, dependency, timing setup, repeatable, or closure path was modeled wrongly and now needs a clean recovery.
---

# Recover From Modeling Mistakes

## Instructions

1. Identify the exact modeling error before changing anything:
   - wrong object type
   - wrong dependency
   - wrong timing fields
   - wrong questline attachment
   - wrong repeatable definition
   - wrong closure action
2. Inspect the affected records directly with the relevant detail reads.
3. Preserve truth first. Prefer corrective writes over history-erasing rewrites.
4. Use the smallest honest recovery move:
   - revise before start
   - detach or move questline membership
   - replace or remove unlocks
   - update repeatable definitions for future behavior
   - abandon and spawn follow-ups when the commitment itself was wrong
   - soft delete only when the row should disappear from active truth
5. After recovery, re-run the relevant read surface to confirm the system now reflects reality.

## Failure Paths

- If correcting the mistake would rewrite real execution history, stop and preserve the old record with a new successor instead.
- If multiple linked records are wrong, repair the structure in dependency order rather than patching one symptom.
- If you cannot tell whether the issue is modeling or execution failure, default to preserving the historical record.

## Do Not

- solve structural mistakes with misleading text edits
- use soft delete as the first answer to every bad model choice
- hide a modeling error by leaving contradictory records in place
