import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initQuestTables } from './init_quest_tables.ts';

describe('initQuestTables', () => {
	it('is safe to call twice on the same connection (idempotent)', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE questlines (id INTEGER PRIMARY KEY)');
		db.exec('CREATE TABLE rumors (id INTEGER PRIMARY KEY)');
		db.exec('CREATE TABLE repeatable_quests (id INTEGER PRIMARY KEY)');
		initQuestTables(db);
		initQuestTables(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'quests'").get()?.c ?? 0,
			),
			1,
		);
	});
});
