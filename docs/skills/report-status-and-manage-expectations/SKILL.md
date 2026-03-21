---
name: report-status-and-manage-expectations
description: Produce trustworthy status and expectation management from system truth. Use when stakeholders ask what is happening, what is slipping, what is blocked, and what should happen next.
---

# Report Status And Manage Expectations

## Instructions

1. Build status from Questlog reads, not narrative memory.
2. Gather the right slices first:
   - `listAvailableQuests(...)`
   - `listBlockedQuests(...)`
   - `listDueSoonQuests(...)`
   - `listOverdueQuests(...)`
   - `listResolvedQuests(...)`
   - `listQuestlines(...)`
   - `getQuestlineDetail(...)`
3. Separate facts clearly:
   - done
   - in progress
   - blocked
   - slipping
   - next
4. Filter by `questlineId` or `tagNames` when reporting one stream.
5. If the report exposes a real issue, update the system state after reporting instead of treating the report itself as the action.

## Failure Paths

- If the status depends on work that is not in the system, say that explicitly instead of pretending certainty.
- If a stakeholder promise or approval is driving the report, connect the update to that external commitment directly.
- If the truth is yellow, say yellow early. Do not wait for red just to protect optics.

## Do Not

- report from memory when the reads disagree
- mix blocked, deferred, and overdue into one vague “at risk” bucket
- let status reporting replace prioritization or unblock action
