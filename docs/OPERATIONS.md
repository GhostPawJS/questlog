# Quest Faculty Operation Semantics

This faculty exposes intention-shaped writes rather than generic CRUD.

## Intake

- `captureRumor()`: record open-ended incoming work without commitment.
- `settleRumor()`: resolve intake into nothing, a questline, quests, or both.
- `dismissRumor()`: explicitly decline a rumor without settling it.
- `reopenRumor()`: return a dismissed rumor to the open intake pool.

## Commitment

- `createQuest()`: create one concrete commitment.
- `reviseQuestObjective()`: edit the objective only before actual start.
- `planQuestTime()`: adjust scheduling and due semantics without changing commitment state.
- `startQuest()`: freeze the objective and enter active execution.
- `logQuestEffort()`: accumulate effort after start.
- `finishQuest()`: resolve successfully.
- `abandonQuest()`: resolve unsuccessfully.
- `abandonQuestAndSpawnFollowups()`: resolve unsuccessfully and atomically create successor work.

## Structure

- `createQuestline()`, `updateQuestline()`, `archiveQuestline()`: manage grouping context.
- `moveQuestToQuestline()`, `detachQuestFromQuestline()`: regroup concrete quests.
- `addUnlock()`, `removeUnlock()`, `replaceUnlocks()`: manage hard prerequisite edges with cycle rejection.

## Recurrence

- `createRepeatableQuest()`: define recurring work.
- `updateRepeatableQuest()`: change future materialization only.
- `spawnDueRepeatableQuests()`: materialize due anchors into new quests.
- `archiveRepeatableQuest()`: stop future spawning without deleting history.

## Rewards And Tags

- `addQuestReward()`, `updateQuestReward()`, `removeQuestReward()`, `claimQuestReward()`: manage concrete quest rewards.
- `replaceRepeatableQuestRewards()`: replace the template rewards copied into future spawned quests.
- `replaceQuestTags()`, `tagQuest()`, `untagQuest()`: manage concrete quest tags.
- `replaceRepeatableQuestTags()`: replace the template tags copied into future spawned quests.

## Soft Delete

Soft delete removes an entity from default reads without rewriting history. It never implies reopening or rematerializing prior work.
