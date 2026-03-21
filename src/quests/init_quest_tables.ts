import type { QuestlogDb } from '../database';

/**
 * Creates quest tables and indices.
 */
export function initQuestTables(db: QuestlogDb): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS quests (
      id                         INTEGER PRIMARY KEY,
      questline_id               INTEGER REFERENCES questlines(id),
      source_rumor_id            INTEGER REFERENCES rumors(id),
      spawned_by_quest_id        INTEGER REFERENCES quests(id),
      spawned_from_repeatable_id INTEGER REFERENCES repeatable_quests(id),
      spawned_for_at             INTEGER,
      title                      TEXT    NOT NULL,
      objective                  TEXT    NOT NULL,
      outcome                    TEXT,
      created_at                 INTEGER NOT NULL,
      updated_at                 INTEGER NOT NULL,
      started_at                 INTEGER,
      resolved_at                INTEGER,
      success                    INTEGER CHECK(success IN (0, 1) OR success IS NULL),
      effort_seconds             INTEGER NOT NULL DEFAULT 0 CHECK(effort_seconds >= 0),
      estimate_seconds           INTEGER CHECK(estimate_seconds IS NULL OR estimate_seconds >= 0),
      not_before_at              INTEGER,
      due_at                     INTEGER,
      scheduled_start_at         INTEGER,
      scheduled_end_at           INTEGER,
      all_day                    INTEGER NOT NULL DEFAULT 0 CHECK(all_day IN (0, 1)),
      deleted_at                 INTEGER,
      CHECK(length(trim(title)) > 0),
      CHECK(length(trim(objective)) > 0),
      CHECK(
        (resolved_at IS NULL AND success IS NULL AND outcome IS NULL)
        OR (resolved_at IS NOT NULL AND success IS NOT NULL AND outcome IS NOT NULL)
      ),
      CHECK(started_at IS NULL OR started_at >= created_at),
      CHECK(resolved_at IS NULL OR resolved_at >= created_at),
      CHECK(resolved_at IS NULL OR started_at IS NULL OR resolved_at >= started_at),
      CHECK(scheduled_end_at IS NULL OR scheduled_start_at IS NOT NULL),
      CHECK(scheduled_end_at IS NULL OR scheduled_end_at >= scheduled_start_at),
      CHECK(not_before_at IS NULL OR due_at IS NULL OR not_before_at <= due_at),
      CHECK(
        (spawned_from_repeatable_id IS NULL AND spawned_for_at IS NULL)
        OR (spawned_from_repeatable_id IS NOT NULL AND spawned_for_at IS NOT NULL)
      )
    )
  `);

	db.exec('CREATE INDEX IF NOT EXISTS idx_quests_deleted_at ON quests(deleted_at)');
	db.exec('CREATE INDEX IF NOT EXISTS idx_quests_questline_id ON quests(questline_id)');
	db.exec('CREATE INDEX IF NOT EXISTS idx_quests_source_rumor_id ON quests(source_rumor_id)');
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quests_spawned_by_quest_id ON quests(spawned_by_quest_id)',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quests_repeatable_anchor ON quests(spawned_from_repeatable_id, spawned_for_at)',
	);
	db.exec(
		'CREATE UNIQUE INDEX IF NOT EXISTS idx_quests_repeatable_anchor_unique ON quests(spawned_from_repeatable_id, spawned_for_at) WHERE spawned_from_repeatable_id IS NOT NULL AND spawned_for_at IS NOT NULL AND deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quests_due_at ON quests(due_at) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quests_not_before_at ON quests(not_before_at) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quests_scheduled_window ON quests(scheduled_start_at, scheduled_end_at) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quests_lifecycle ON quests(started_at, resolved_at, success) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quests_created_at_active ON quests(created_at DESC, id DESC) WHERE deleted_at IS NULL',
	);
}
