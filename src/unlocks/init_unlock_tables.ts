import type { QuestlogDb } from '../database';

/**
 * Creates unlock tables and indices.
 */
export function initUnlockTables(db: QuestlogDb): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS quest_unlocks (
      id            INTEGER PRIMARY KEY,
      from_quest_id INTEGER NOT NULL REFERENCES quests(id),
      to_quest_id   INTEGER NOT NULL REFERENCES quests(id),
      created_at    INTEGER NOT NULL,
      deleted_at    INTEGER,
      CHECK(from_quest_id <> to_quest_id)
    )
  `);
	db.exec(
		'CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_unlocks_pair_unique ON quest_unlocks(from_quest_id, to_quest_id) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quest_unlocks_to_quest_id ON quest_unlocks(to_quest_id) WHERE deleted_at IS NULL',
	);
}
