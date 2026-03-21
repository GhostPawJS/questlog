---
name: create-concrete-quest
description: Create honest executable commitments. Use when the work is specific enough that someone can start it, execute it, and resolve it as one concrete unit.
---

# Create Concrete Quest

## Instructions

1. Create a quest only when the work is real, bounded, and executable.
2. Use `createQuest(db, input)` with a concrete title and an objective that describes the actual outcome, not vague intent.
3. Attach optional context only when true:
   - `questlineId` for umbrella context
   - `sourceRumorId` for intake provenance
   - timing fields if they are already known
   - `tags` or `rewards` if they help downstream operation
4. Immediately decide whether the quest also needs timing, tags, rewards, or unlocks.
5. Verify the created work later through `getQuestDetail(db, questId, now?)`.

## Failure Paths

- If the work still needs interpretation, stop and return to intake or clarification.
- If the work is really multiple steps, create a questline and split it into quests.
- If the work repeats, switch to `createRepeatableQuest(db, input)` instead of creating a fake standing quest.

## Do Not

- create quests with titles that hide the real action
- collapse several independent actions into one quest
- use quest creation to store vague ideas
