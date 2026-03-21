import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initTagTables } from './init_tag_tables.ts';

describe('initTagTables', () => {
	it('is idempotent when prerequisite tables exist', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE quests (id INTEGER PRIMARY KEY)');
		db.exec('CREATE TABLE repeatable_quests (id INTEGER PRIMARY KEY)');
		initTagTables(db);
		initTagTables(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'tags'").get()?.c ?? 0,
			),
			1,
		);
	});
});
