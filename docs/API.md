# Quest Faculty API Reference

## Initialization

- `initQuestFacultyTables(db)`

Call once for a database before using any other faculty operation.

## Surface Split

- full barrel: `src/faculties/quests/index.ts`
- read-only barrel: `src/faculties/quests/api/read/index.ts`
- write-only barrel: `src/faculties/quests/api/write/index.ts`

## Write Operations

### Rumors

- `captureRumor(db, input)`
- `settleRumor(db, rumorId, input)`
- `dismissRumor(db, rumorId, dismissedAt?)`
- `reopenRumor(db, rumorId, now?)`
- `softDeleteRumor(db, rumorId, now?)`

`settleRumor()` is the canonical intake-resolution operation.

### Questlines

- `createQuestline(db, input)`
- `updateQuestline(db, questlineId, input)`
- `archiveQuestline(db, questlineId, archivedAt?)`
- `moveQuestToQuestline(db, questId, questlineId, now?)`
- `detachQuestFromQuestline(db, questId, now?)`
- `softDeleteQuestline(db, questlineId, deletedAt?)`

### Quests

- `createQuest(db, input)`
- `reviseQuestObjective(db, questId, objective, now?)`
- `planQuestTime(db, questId, input)`
- `startQuest(db, questId, startedAt?)`
- `logQuestEffort(db, questId, effortSeconds, now?)`
- `finishQuest(db, questId, outcome, resolvedAt?)`
- `abandonQuest(db, questId, outcome, resolvedAt?)`
- `abandonQuestAndSpawnFollowups(db, questId, outcome, followups, resolvedAt?)`
- `softDeleteQuest(db, questId, deletedAt?)`

### Unlocks

- `addUnlock(db, fromQuestId, toQuestId, now?)`
- `removeUnlock(db, fromQuestId, toQuestId, now?)`
- `replaceUnlocks(db, toQuestId, fromQuestIds, now?)`

Cycle creation is rejected.

### Repeatable Quests

- `createRepeatableQuest(db, input)`
- `updateRepeatableQuest(db, repeatableQuestId, input)`
- `archiveRepeatableQuest(db, repeatableQuestId, archivedAt?)`
- `listDueRepeatableQuestAnchors(db, now)`
- `spawnDueRepeatableQuests(db, now)`
- `softDeleteRepeatableQuest(db, repeatableQuestId, deletedAt?)`

`spawnDueRepeatableQuests()` performs recurrence deduplication by repeatable quest id plus recurrence anchor.

### Rewards

- `addQuestReward(db, questId, input)`
- `updateQuestReward(db, rewardId, input)`
- `removeQuestReward(db, rewardId, now?)`
- `claimQuestReward(db, rewardId, claimedAt?)`
- `replaceRepeatableQuestRewards(db, repeatableQuestId, rewards, now?)`

Claiming is only allowed for successfully resolved quests.

### Tags

- `replaceQuestTags(db, questId, tagNames, now?)`
- `tagQuest(db, questId, tagNames, now?)`
- `untagQuest(db, questId, tagNames, now?)`
- `replaceRepeatableQuestTags(db, repeatableQuestId, tagNames, now?)`

## Read Models

- `getQuestDetail(db, questId, now?)`
- `getRumorDetail(db, rumorId)`
- `getQuestlineDetail(db, questlineId, now?)`
- `listRumors(db)`
- `listQuestlines(db, now?)`
- `listAvailableQuests(db, filters?, now?)`
- `listActiveQuests(db, filters?, now?)`
- `listBlockedQuests(db, filters?, now?)`
- `listOpenQuests(db, filters?, now?)`
- `listInProgressQuests(db, filters?, now?)`
- `listResolvedQuests(db, filters?, now?)`
- `listOverdueQuests(db, filters?, now?)`
- `listDueSoonQuests(db, horizonMs, filters?, now?)`
- `listScheduledForDay(db, dayStart, dayEnd, filters?, now?)`
- `listScheduledNow(db, filters?, now?)`
- `listMissedScheduledQuests(db, filters?, now?)`
- `listDeferredQuests(db, filters?, now?)`
- `getRumorOutputs(db, rumorId)`
- `searchQuestFaculty(db, query)`

## Scheduling Semantics

The faculty models scheduling as read policies over quest truth:

- available work comes from unlock completion plus `not_before_at`
- active work means unresolved open or in-progress concrete quests
- blocked work means unresolved quests with unmet unlock prerequisites
- due/overdue comes from effective due date only
- scheduled-now and scheduled-today come from scheduled window overlap
- missed scheduled work is separate from overdue work

## RRULE Support

The current implementation supports these RRULE dimensions:

- `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`
- `INTERVAL=n`
- `COUNT=n`
- `UNTIL=<parseable date>`
- `BYDAY=...` for weekly rules

This is enough for the standalone faculty’s initial recurring-work engine without importing external recurrence libraries.
