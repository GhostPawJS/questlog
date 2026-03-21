# Tags

## What It Is

Tags are the classification layer in Questlog.

It answers the question: "when two records say `work`, are they referring to the
same tag identity?" The answer is yes, because Questlog normalizes tag names and
stores a single canonical tag identity behind the scenes.

## Why It Exists

Tags exist so operators get:

- one stable tag vocabulary across the database
- case-insensitive and whitespace-insensitive matching
- no duplicate active tag identities such as `Work`, `work`, and ` work `
- clean joins for filtering and reporting

Just as importantly, tags stay separate from status, dependency, and scheduling
truth so classification can stay flexible without corrupting the operational
meaning of the work itself.

## How To Use Them

Operators usually do not manage tag rows directly.

Instead, tags are created implicitly when you call:

- `write.replaceQuestTags()`
- `write.tagQuest()`
- `write.replaceRepeatableQuestTags()`

Those operations normalize names and attach the tag where it belongs.

## Good Uses

- context labels like `deep-work`, `errands`, `writing`
- domain labels like `finance`, `marketing`, `infra`
- reporting labels such as `quarter-goal` or `urgent`

## Do Not Use Them For

- status
- notes
- dependencies
- timing or lifecycle logic

- status belongs in quest lifecycle
- notes belong in the quest objective or related operator context
- dependencies belong in `quest_unlocks`

Use tags for classification, grouping, saved filters, and reporting.

## Under The Hood

Tags span more than one table because Questlog separates identity from
attachment:

- `tags`: the canonical tag vocabulary
- `quest_tags`: tag links on concrete quests
- `repeatable_quest_tags`: template tag links used for auto-tagging future
  spawned quests

That split is an implementation detail in service of clean operator behavior:
one stable tag identity, plus different attachment contexts for real quests and
future recurring templates.

## Public APIs

### Writes

- `write.replaceQuestTags(db, questId, tagNames, now?)`: replace the full tag set on a concrete quest.
- `write.tagQuest(db, questId, tagNames, now?)`: add tags to a concrete quest without disturbing the rest.
- `write.untagQuest(db, questId, tagNames, now?)`: remove specific tags from a concrete quest.
- `write.replaceRepeatableQuestTags(db, repeatableQuestId, tagNames, now?)`: replace the future auto-tag template set on a recurring quest.

### Reads

- There is no dedicated tag read surface.
- Tags are surfaced through richer quest reads such as `read.getQuestDetail()` and list views built on quest detail.
