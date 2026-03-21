---
name: intake-triage
description: Triage new asks, ideas, requests, and vague incoming work into the right next step. Use when something arrives and it is not yet clear whether it should stay intake, be clarified, be dismissed, or become committed work.
---

# Intake Triage

## Instructions

1. Default to intake first. If the work is not already concrete and executable, use `captureRumor(db, input)` instead of creating a quest.
2. Capture the minimum facts: what arrived, why it matters, any deadline signal, any external requester, and the main uncertainty.
3. Before creating a new rumor, check for obvious duplicates with `searchQuestlog(db, query)` and `listRumors(db)`.
4. Choose one next state:
   - keep it open as a rumor
   - dismiss it with `dismissRumor(db, rumorId, dismissedAt?)`
   - reopen it with `reopenRumor(db, rumorId, now?)`
   - send it to clarification before commitment
   - settle it later into structure
5. Keep rumor titles short and concrete. Put uncertainty, context, and caveats in `details`.

## Failure Paths

- If the ask is urgent but unclear, still capture it first, then switch to clarification. Do not invent execution detail.
- If similar work already exists, update or reuse the existing item instead of creating parallel intake.
- If the work is already clearly executable, hand off to `choose-work-shape` rather than letting it rot in intake.

## Do Not

- create a quest just because someone asked for something
- use rumors as execution tracking
- dismiss an item only because details are incomplete
