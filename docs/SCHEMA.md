# Quest Faculty Schema Reference

## Tables

### `rumors`

- `id`
- `title`
- `details`
- `created_at`
- `updated_at`
- `settled_at`
- `dismissed_at`
- `deleted_at`

Constraints:

- non-empty trimmed `title`
- rumor cannot be settled and dismissed at the same time

### `questlines`

- `id`
- `source_rumor_id`
- `title`
- `description`
- `starts_at`
- `due_at`
- `created_at`
- `updated_at`
- `archived_at`
- `deleted_at`

Constraints:

- non-empty trimmed `title`
- if both timestamps exist, `due_at >= starts_at`

### `repeatable_quests`

- `id`
- `questline_id`
- `title`
- `objective`
- `rrule`
- `anchor_at`
- `not_before_offset_seconds`
- `due_offset_seconds`
- `scheduled_start_offset_seconds`
- `scheduled_end_offset_seconds`
- `all_day`
- `estimate_seconds`
- `created_at`
- `updated_at`
- `archived_at`
- `deleted_at`

Constraints:

- non-empty trimmed `title`
- non-empty trimmed `objective`
- non-negative `estimate_seconds`
- scheduled end offset requires scheduled start offset
- scheduled end offset cannot precede scheduled start offset

### `quests`

- `id`
- `questline_id`
- `source_rumor_id`
- `spawned_by_quest_id`
- `spawned_from_repeatable_id`
- `spawned_for_at`
- `title`
- `objective`
- `outcome`
- `created_at`
- `updated_at`
- `started_at`
- `resolved_at`
- `success`
- `effort_seconds`
- `estimate_seconds`
- `not_before_at`
- `due_at`
- `scheduled_start_at`
- `scheduled_end_at`
- `all_day`
- `deleted_at`

Constraints:

- non-empty trimmed `title`
- non-empty trimmed `objective`
- `effort_seconds >= 0`
- `estimate_seconds >= 0` when present
- resolution truth is all-or-nothing: `resolved_at`, `success`, and `outcome`
- scheduled end requires scheduled start
- scheduled end cannot precede scheduled start
- `not_before_at` cannot be after `due_at`
- repeatable provenance requires both `spawned_from_repeatable_id` and `spawned_for_at`

### `quest_unlocks`

- `id`
- `from_quest_id`
- `to_quest_id`
- `created_at`
- `deleted_at`

Constraints:

- source and target quest cannot be the same row
- active unlock pairs are unique

### `quest_rewards`

- `id`
- `quest_id`
- `kind`
- `name`
- `description`
- `quantity`
- `created_at`
- `claimed_at`
- `deleted_at`

Constraints:

- non-empty trimmed `kind`
- non-empty trimmed `name`
- `quantity >= 0` when present

### `repeatable_quest_rewards`

- `id`
- `repeatable_quest_id`
- `kind`
- `name`
- `description`
- `quantity`
- `created_at`
- `deleted_at`

Constraints mirror `quest_rewards`.

### `tags`

- `id`
- `name`
- `normalized_name`
- `created_at`
- `deleted_at`

Constraints:

- non-empty trimmed display and normalized names
- active `normalized_name` values are globally unique

### `quest_tags`

- `quest_id`
- `tag_id`
- `created_at`
- `deleted_at`

Active `(quest_id, tag_id)` pairs are unique.

### `repeatable_quest_tags`

- `repeatable_quest_id`
- `tag_id`
- `created_at`
- `deleted_at`

Active `(repeatable_quest_id, tag_id)` pairs are unique.

## Indices

The schema ships with indices for:

- active/open rumor reads
- questline due date reads
- active repeatable quest reads
- quest provenance and recurrence anchor reads
- effective scheduling and lifecycle reads
- unlock graph traversal
- reward lookup and claim-state lookup
- tag normalization and quest tag joins

## Full-Text Search

The faculty creates two FTS5 tables:

- `quests_fts`
- `rumors_fts`

Both are maintained by triggers and queried only through faculty read models. Search results are always filtered against soft-deleted base rows.
