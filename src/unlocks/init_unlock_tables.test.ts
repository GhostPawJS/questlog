import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initUnlockTables } from './init_unlock_tables.ts';

describe('initUnlockTables', () => {
	it('is idempotent when quests exists', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE quests (id INTEGER PRIMARY KEY)');
		initUnlockTables(db);
		initUnlockTables(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'quest_unlocks'").get()
					?.c ?? 0,
			),
			1,
		);
	});
});
