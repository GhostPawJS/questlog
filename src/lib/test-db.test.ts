import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from './open-test-database.ts';
import { createInitializedQuestlogDb } from './test-db.ts';

describe('createInitializedQuestlogDb', () => {
	it('installs the full questlog schema so core tables exist and are queryable', async () => {
		const db = await createInitializedQuestlogDb();
		strictEqual(
			Number(
				db
					.prepare(
						`SELECT COUNT(*) AS c FROM sqlite_master
             WHERE type = 'table' AND name IN ('quests', 'questlines', 'rumors', 'repeatable_quests')`,
					)
					.get()?.c ?? 0,
			),
			4,
		);
		db.prepare('SELECT 1 FROM quests LIMIT 1').get();
	});

	it('differs from a bare openTestDatabase: no schema until init', async () => {
		const bare = await openTestDatabase();
		throws(() => {
			bare.prepare('SELECT 1 FROM quests').get();
		}, /no such table/i);
	});
});
