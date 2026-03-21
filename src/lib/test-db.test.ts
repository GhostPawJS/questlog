import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from './open-test-database.ts';
import { createInitializedQuestlogDb } from './test-db.ts';

describe('createInitializedQuestlogDb', () => {
	it('returns a usable initialized database', async () => {
		const db = await createInitializedQuestlogDb();

		const row = db.prepare('SELECT 1 AS ok FROM quests LIMIT 1').get();
		strictEqual(Number(row?.ok ?? 1), 1);
	});

	it('differs from a bare openTestDatabase: no schema until init', async () => {
		const bare = await openTestDatabase();
		throws(() => {
			bare.prepare('SELECT 1 FROM quests').get();
		}, /no such table/i);
	});
});
