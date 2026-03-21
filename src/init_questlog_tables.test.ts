import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from './database.ts';
import { createInitializedQuestlogDb } from './lib/test-db.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('initQuestlogTables', () => {
	it('creates all expected top-level tables', () => {
		const row = db
			.prepare(
				`SELECT COUNT(*) AS total
         FROM sqlite_master
         WHERE type = 'table'
           AND name IN (
             'rumors',
             'questlines',
             'repeatable_quests',
             'quests',
             'quest_unlocks',
             'quest_rewards',
             'repeatable_quest_rewards',
             'tags',
             'quest_tags',
             'repeatable_quest_tags'
           )`,
			)
			.get();
		strictEqual(Number(row?.total ?? 0), 10);
	});

	it('hides soft-deleted rows from FTS-backed search queries', () => {
		db.prepare(
			`INSERT INTO rumors (title, details, created_at, updated_at)
       VALUES ('Idea', 'Interesting thing', 1, 1)`,
		).run();
		db.prepare(
			`INSERT INTO quests (title, objective, created_at, updated_at, effort_seconds, all_day)
       VALUES ('Deploy', 'Ship v2', 1, 1, 0, 0)`,
		).run();

		let row = db
			.prepare(
				`SELECT COUNT(*) AS total
         FROM rumors_fts
         JOIN rumors r ON r.id = rumors_fts.rowid
         WHERE rumors_fts MATCH 'Interesting' AND r.deleted_at IS NULL`,
			)
			.get();
		strictEqual(Number(row?.total ?? 0), 1);

		row = db
			.prepare(
				`SELECT COUNT(*) AS total
         FROM quests_fts
         JOIN quests q ON q.id = quests_fts.rowid
         WHERE quests_fts MATCH 'Ship' AND q.deleted_at IS NULL`,
			)
			.get();
		strictEqual(Number(row?.total ?? 0), 1);

		db.prepare('UPDATE rumors SET deleted_at = 2 WHERE id = 1').run();
		db.prepare('UPDATE quests SET deleted_at = 2 WHERE id = 1').run();

		row = db
			.prepare(
				`SELECT COUNT(*) AS total
         FROM rumors_fts
         JOIN rumors r ON r.id = rumors_fts.rowid
         WHERE rumors_fts MATCH 'Interesting' AND r.deleted_at IS NULL`,
			)
			.get();
		strictEqual(Number(row?.total ?? 0), 0);

		row = db
			.prepare(
				`SELECT COUNT(*) AS total
         FROM quests_fts
         JOIN quests q ON q.id = quests_fts.rowid
         WHERE quests_fts MATCH 'Ship' AND q.deleted_at IS NULL`,
			)
			.get();
		strictEqual(Number(row?.total ?? 0), 0);
	});
});
