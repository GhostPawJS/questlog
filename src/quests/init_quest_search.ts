import type { QuestlogDb } from '../database';

/**
 * Creates quest full-text search tables and triggers.
 */
export function initQuestSearch(db: QuestlogDb): void {
	db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS quests_fts USING fts5(
      title,
      objective,
      outcome,
      content=quests,
      content_rowid=id
    )
  `);
	db.exec(`
    CREATE TRIGGER IF NOT EXISTS quests_fts_insert
    AFTER INSERT ON quests
    WHEN new.deleted_at IS NULL
    BEGIN
      INSERT INTO quests_fts(rowid, title, objective, outcome)
      VALUES (new.id, new.title, new.objective, COALESCE(new.outcome, ''));
    END
  `);
	db.exec(`
    CREATE TRIGGER IF NOT EXISTS quests_fts_update
    AFTER UPDATE OF title, objective, outcome, deleted_at ON quests
    BEGIN
      INSERT INTO quests_fts(quests_fts, rowid, title, objective, outcome)
      VALUES ('delete', old.id, old.title, old.objective, COALESCE(old.outcome, ''));
      INSERT INTO quests_fts(rowid, title, objective, outcome)
      SELECT new.id, new.title, new.objective, COALESCE(new.outcome, '')
      WHERE new.deleted_at IS NULL;
    END
  `);
}
