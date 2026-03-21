import type { QuestlogDb } from '../database.ts';

/**
 * Creates reward tables and indices.
 */
export function initRewardTables(db: QuestlogDb): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS quest_rewards (
      id          INTEGER PRIMARY KEY,
      quest_id    INTEGER NOT NULL REFERENCES quests(id),
      kind        TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      description TEXT,
      quantity    REAL CHECK(quantity IS NULL OR quantity >= 0),
      created_at  INTEGER NOT NULL,
      claimed_at  INTEGER,
      deleted_at  INTEGER,
      CHECK(length(trim(kind)) > 0),
      CHECK(length(trim(name)) > 0)
    )
  `);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quest_rewards_quest_id ON quest_rewards(quest_id) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quest_rewards_claimed_at ON quest_rewards(claimed_at) WHERE deleted_at IS NULL',
	);

	db.exec(`
    CREATE TABLE IF NOT EXISTS repeatable_quest_rewards (
      id                  INTEGER PRIMARY KEY,
      repeatable_quest_id INTEGER NOT NULL REFERENCES repeatable_quests(id),
      kind                TEXT    NOT NULL,
      name                TEXT    NOT NULL,
      description         TEXT,
      quantity            REAL CHECK(quantity IS NULL OR quantity >= 0),
      created_at          INTEGER NOT NULL,
      deleted_at          INTEGER,
      CHECK(length(trim(kind)) > 0),
      CHECK(length(trim(name)) > 0)
    )
  `);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_repeatable_quest_rewards_repeatable_quest_id ON repeatable_quest_rewards(repeatable_quest_id) WHERE deleted_at IS NULL',
	);
}
