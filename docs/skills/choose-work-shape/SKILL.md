---
name: choose-work-shape
description: Choose the correct Questlog object for new work. Use when deciding whether something should remain a rumor, become a quest, become a questline, or be modeled as a repeatable definition.
---

# Choose Work Shape

## Instructions

1. Start from the decision, not the object name: ask whether the item is uncertain, executable, multi-step, or recurring.
2. Use `captureRumor(db, input)` when the work is still intake, judgment, or unresolved ambiguity.
3. Use `createQuest(db, input)` when someone can directly start, do, and resolve the work.
4. Use `createQuestline(db, input)` when several quests need one shared arc, frame, or due horizon.
5. Use `createRepeatableQuest(db, input)` when the same shape of work should spawn fresh quest instances over time.
6. Use `settleRumor(db, rumorId, input)` when a rumor is ready to become quests, a questline, or both.

## Failure Paths

- If something feels both vague and actionable, keep it a rumor until one concrete executable step is clear.
- If a questline contains only one actionable thing, prefer a quest unless shared context really matters.
- If you are tempted to keep one quest open forever for recurring work, stop and switch to a repeatable quest.

## Do Not

- use a questline as a status bucket
- use a rumor as a soft backlog for committed work
- use a repeatable quest to represent already-started work
