---
name: escalate-and-unblock
description: Escalate at the right time and remove blockers cleanly. Use when work cannot move because of missing decisions, dependencies, approvals, access, or outside intervention.
---

# Escalate And Unblock

## Instructions

1. Identify the blocker type first: dependency, approval, missing decision, access, external response, or bad work shape.
2. Confirm the operational effect with `listBlockedQuests(...)`, `getQuestDetail(...)`, or the relevant review reads.
3. If the blocker is modeled as a hard dependency, inspect or change the unlock graph with `addUnlock(...)`, `removeUnlock(...)`, or `replaceUnlocks(...)`.
4. If the blocker is not in the model, document the real blocker explicitly in the quest text, outcome, or surrounding context before escalating.
5. Escalate early enough that options still exist.
6. After intervention, reflect the new truth in Questlog by rescheduling, ungating, abandoning, or creating follow-up work.

## Failure Paths

- If the work is not truly blocked but merely unclear, hand off to clarification or reshaping instead of escalating noise.
- If escalation is needed repeatedly for the same class of issue, treat it as a structural pattern, not a one-off.
- If the blocker is external, connect it to the relevant promise or approval path instead of leaving it as generic “waiting.”

## Do Not

- wait until the deadline is already lost before escalating
- use unlocks for non-modeled blockers like vague stakeholder indecision
- close the item mentally without updating system state afterward
