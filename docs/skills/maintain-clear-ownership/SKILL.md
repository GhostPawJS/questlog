---
name: maintain-clear-ownership
description: Keep accountability, handoffs, and sustainment ownership explicit. Use when ownership is fuzzy, work changes hands, or responsibility will be lost unless it is recorded and reviewed deliberately.
---

# Maintain Clear Ownership

## Instructions

1. Assume ownership ambiguity is a real failure mode, even though Questlog has no first-class assignee field.
2. When ownership matters, record it explicitly in the quest title, objective, details, tags, or the surrounding system.
3. During handoffs, inspect the exact work item with `getQuestDetail(...)` or `getQuestlineDetail(...)` before transferring context.
4. Make handoffs concrete:
   - what is done
   - what remains
   - what is blocked
   - what the next real step is
5. After the handoff, update timing, structure, or follow-up quests so the system truth matches the new plan.

## Failure Paths

- If nobody can say who owns the next move, treat that as unresolved risk, not social noise.
- If the work needs a new steward but the model cannot encode assignees directly, use explicit text and review rituals rather than pretending assignment does not matter.
- If sustainment ownership differs from delivery ownership, create closure and successor work accordingly.

## Do Not

- assume shared ownership means clear ownership
- let handoffs happen only in chat
- invent assignment APIs that do not exist in Questlog
