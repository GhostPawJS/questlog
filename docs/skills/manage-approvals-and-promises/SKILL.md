---
name: manage-approvals-and-promises
description: Track approval paths and external commitments explicitly. Use when legal, finance, exec, partner, customer, or regulatory promises create real delivery pressure or last-mile risk.
---

# Manage Approvals And Promises

## Instructions

1. Treat approvals and promises as first-class management realities, not side notes.
2. Create concrete quests for the approval-producing steps, not just for the work waiting behind them.
3. Add unlocks when downstream work must stay unavailable until approval work succeeds.
4. Use `planQuestTime(...)` to reflect real decision dates, due dates, and review windows.
5. Review these items aggressively through:
   - `listDueSoonQuests(...)`
   - `listBlockedQuests(...)`
   - `listOverdueQuests(...)`
6. Keep the external promise or approver visible in titles, objectives, tags, or questline context. Do not assume an assignee model exists.

## Failure Paths

- If a date matters because of a promise, do not leave it only in chat or memory.
- If approval is the critical path, create explicit approval work rather than burying it inside a broader quest.
- If one delayed approval now threatens several items, prioritize and escalate the approval path itself.

## Do Not

- assume approvals will “just happen later”
- hide external commitments inside vague quest text
- confuse internal preference dates with real external promises
