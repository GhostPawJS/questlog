---
name: settle-rumor-into-structure
description: Convert validated intake into committed work cleanly. Use when a rumor is ready to become one or more quests, a questline, or both without leaving ambiguity in intake forever.
---

# Settle Rumor Into Structure

## Instructions

1. Confirm the rumor is actually ready: the intended outcome, the work shape, and the immediate next structure should be clear.
2. Prefer `settleRumor(db, rumorId, input)` when the work came from intake and you want provenance preserved.
3. Use the settlement shape that matches reality:
   - questline only
   - quests only
   - questline plus quests
   - nothing, if the rumor was resolved without downstream work
4. Keep the questline for shared context and the quests for executable commitments.
5. After settlement, verify the result with `getRumorDetail(db, rumorId)` or `getRumorOutputs(db, rumorId)`.

## Failure Paths

- If the rumor is still too vague, stop and return to clarification instead of settling prematurely.
- If the settlement would create only one concrete executable item, consider creating just a quest.
- If settlement was wrong, repair with the relevant cleanup writes. Do not pretend the rumor was never settled.

## Do Not

- leave a ready rumor open for weeks
- create duplicate downstream structure outside `settleRumor()` when provenance matters
- confuse dismissal with settlement
