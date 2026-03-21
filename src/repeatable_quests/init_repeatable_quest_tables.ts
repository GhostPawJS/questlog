import type { QuestlogDb } from '../database.ts';

/**
 * Creates repeatable quest tables and indices.
 */
export function initRepeatableQuestTables(db: QuestlogDb): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS repeatable_quests (
      id                             INTEGER PRIMARY KEY,
      questline_id                   INTEGER REFERENCES questlines(id),
      title                          TEXT    NOT NULL,
      objective                      TEXT    NOT NULL,
      rrule                          TEXT    NOT NULL,
      anchor_at                      INTEGER NOT NULL,
      not_before_offset_seconds      INTEGER,
      due_offset_seconds             INTEGER,
      scheduled_start_offset_seconds INTEGER,
      scheduled_end_offset_seconds   INTEGER,
      all_day                        INTEGER NOT NULL DEFAULT 0 CHECK(all_day IN (0, 1)),
      estimate_seconds               INTEGER CHECK(estimate_seconds IS NULL OR estimate_seconds >= 0),
      created_at                     INTEGER NOT NULL,
      updated_at                     INTEGER NOT NULL,
      archived_at                    INTEGER,
      deleted_at                     INTEGER,
      CHECK(length(trim(title)) > 0),
      CHECK(length(trim(objective)) > 0),
      CHECK(scheduled_end_offset_seconds IS NULL OR scheduled_start_offset_seconds IS NOT NULL),
      CHECK(
        scheduled_end_offset_seconds IS NULL
        OR scheduled_end_offset_seconds >= scheduled_start_offset_seconds
      )
    )
  `);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_repeatable_quests_deleted_at ON repeatable_quests(deleted_at)',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_repeatable_quests_archived_at ON repeatable_quests(archived_at)',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_repeatable_quests_active_anchor ON repeatable_quests(anchor_at) WHERE deleted_at IS NULL AND archived_at IS NULL',
	);
}
