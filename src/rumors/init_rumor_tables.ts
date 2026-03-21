import type { QuestlogDb } from '../database';

/**
 * Creates rumor tables and indices.
 */
export function initRumorTables(db: QuestlogDb): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS rumors (
      id            INTEGER PRIMARY KEY,
      title         TEXT    NOT NULL,
      details       TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      settled_at    INTEGER,
      dismissed_at  INTEGER,
      deleted_at    INTEGER,
      CHECK(length(trim(title)) > 0),
      CHECK(settled_at IS NULL OR dismissed_at IS NULL)
    )
  `);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_rumors_open ON rumors(settled_at, dismissed_at, deleted_at)',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_rumors_created_at_active ON rumors(created_at DESC, id DESC) WHERE deleted_at IS NULL',
	);
}
