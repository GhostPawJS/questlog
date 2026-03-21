import type { QuestlogDb } from '../database';

/**
 * Creates rumor full-text search tables and triggers.
 */
export function initRumorSearch(db: QuestlogDb): void {
	db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS rumors_fts USING fts5(
      title,
      details,
      content=rumors,
      content_rowid=id
    )
  `);
	db.exec(`
    CREATE TRIGGER IF NOT EXISTS rumors_fts_insert
    AFTER INSERT ON rumors
    WHEN new.deleted_at IS NULL
    BEGIN
      INSERT INTO rumors_fts(rowid, title, details)
      VALUES (new.id, new.title, COALESCE(new.details, ''));
    END
  `);
	db.exec(`
    CREATE TRIGGER IF NOT EXISTS rumors_fts_update
    AFTER UPDATE OF title, details, deleted_at ON rumors
    BEGIN
      INSERT INTO rumors_fts(rumors_fts, rowid, title, details)
      VALUES ('delete', old.id, old.title, COALESCE(old.details, ''));
      INSERT INTO rumors_fts(rowid, title, details)
      SELECT new.id, new.title, COALESCE(new.details, '')
      WHERE new.deleted_at IS NULL;
    END
  `);
}
