import type { QuestlogDb } from '../database';

/**
 * Creates questline tables and indices.
 */
export function initQuestlineTables(db: QuestlogDb): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS questlines (
      id              INTEGER PRIMARY KEY,
      source_rumor_id INTEGER REFERENCES rumors(id),
      title           TEXT    NOT NULL,
      description     TEXT,
      starts_at       INTEGER,
      due_at          INTEGER,
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL,
      archived_at     INTEGER,
      deleted_at      INTEGER,
      CHECK(length(trim(title)) > 0),
      CHECK(due_at IS NULL OR starts_at IS NULL OR due_at >= starts_at)
    )
  `);
	db.exec('CREATE INDEX IF NOT EXISTS idx_questlines_due_at ON questlines(due_at)');
	db.exec('CREATE INDEX IF NOT EXISTS idx_questlines_deleted_at ON questlines(deleted_at)');
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_questlines_source_rumor_id ON questlines(source_rumor_id) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_questlines_created_at_active ON questlines(created_at DESC, id DESC) WHERE deleted_at IS NULL',
	);
}
