import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initRepeatableQuestTables } from './init_repeatable_quest_tables.ts';

describe('initRepeatableQuestTables', () => {
	it('is idempotent on a bare connection', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE questlines (id INTEGER PRIMARY KEY)');
		initRepeatableQuestTables(db);
		initRepeatableQuestTables(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'repeatable_quests'").get()
					?.c ?? 0,
			),
			1,
		);
	});
});
