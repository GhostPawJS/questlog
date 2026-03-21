---
name: clarify-ambiguous-requests
description: Turn vague asks into bounded outcomes before commitment. Use when a request lacks scope, success criteria, constraints, urgency, or enough detail to choose the right Questlog object safely.
---

# Clarify Ambiguous Requests

## Instructions

1. Treat ambiguity as a real state, not a nuisance. Do not commit unclear work directly.
2. Extract the missing pieces explicitly:
   - desired outcome
   - why it matters
   - deadline or urgency
   - constraints or approvals
   - what would count as done
3. Ask the smallest clarifying questions that remove the main uncertainty first.
4. Record the current state as a rumor with `captureRumor(db, input)` if the work still lacks enough shape for commitment.
5. After clarification, hand off cleanly:
   - rumor stays a rumor if uncertainty remains
   - `createQuest(db, input)` if one person can now execute it
   - `createQuestline(db, input)` or `settleRumor(db, rumorId, input)` if it is an arc, not one step

## Failure Paths

- If the requester insists on speed without clarity, capture the uncertainty and document the risk instead of fabricating certainty.
- If ownership matters, record it in titles, notes, or the surrounding system. Do not invent an assignee API that does not exist.
- If the request hides an approval, dependency, or external promise, hand off to the matching skill instead of burying that risk in the objective text.

## Do Not

- translate “ASAP” directly into a quest without clarifying tradeoffs
- confuse a vague request with a large initiative
- use tags or questlines to hide missing scope
