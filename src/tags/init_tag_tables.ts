import type { QuestlogDb } from '../database';

/**
 * Creates tag tables and indices.
 */
export function initTagTables(db: QuestlogDb): void {
	db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id              INTEGER PRIMARY KEY,
      name            TEXT    NOT NULL,
      normalized_name TEXT    NOT NULL,
      created_at      INTEGER NOT NULL,
      deleted_at      INTEGER,
      CHECK(length(trim(name)) > 0),
      CHECK(length(trim(normalized_name)) > 0)
    )
  `);
	db.exec(
		'CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_normalized_name_unique ON tags(normalized_name) WHERE deleted_at IS NULL',
	);

	db.exec(`
    CREATE TABLE IF NOT EXISTS quest_tags (
      quest_id    INTEGER NOT NULL REFERENCES quests(id),
      tag_id      INTEGER NOT NULL REFERENCES tags(id),
      created_at  INTEGER NOT NULL,
      deleted_at  INTEGER,
      PRIMARY KEY (quest_id, tag_id, created_at)
    )
  `);
	db.exec(
		'CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_tags_unique ON quest_tags(quest_id, tag_id) WHERE deleted_at IS NULL',
	);
	db.exec(
		'CREATE INDEX IF NOT EXISTS idx_quest_tags_tag_id ON quest_tags(tag_id) WHERE deleted_at IS NULL',
	);

	db.exec(`
    CREATE TABLE IF NOT EXISTS repeatable_quest_tags (
      repeatable_quest_id INTEGER NOT NULL REFERENCES repeatable_quests(id),
      tag_id              INTEGER NOT NULL REFERENCES tags(id),
      created_at          INTEGER NOT NULL,
      deleted_at          INTEGER,
      PRIMARY KEY (repeatable_quest_id, tag_id, created_at)
    )
  `);
	db.exec(
		'CREATE UNIQUE INDEX IF NOT EXISTS idx_repeatable_quest_tags_unique ON repeatable_quest_tags(repeatable_quest_id, tag_id) WHERE deleted_at IS NULL',
	);
}
