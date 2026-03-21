import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initQuestSearch } from './init_quest_search.ts';
import { initQuestTables } from './init_quest_tables.ts';

describe('initQuestSearch', () => {
	it('creates FTS5 and triggers idempotently on top of quests', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE questlines (id INTEGER PRIMARY KEY)');
		db.exec('CREATE TABLE rumors (id INTEGER PRIMARY KEY)');
		db.exec('CREATE TABLE repeatable_quests (id INTEGER PRIMARY KEY)');
		initQuestTables(db);
		initQuestSearch(db);
		initQuestSearch(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'quests_fts'").get()?.c ??
					0,
			),
			1,
		);
	});
});
