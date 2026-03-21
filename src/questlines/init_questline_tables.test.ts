import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initQuestlineTables } from './init_questline_tables.ts';

describe('initQuestlineTables', () => {
	it('is idempotent on a bare connection', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE rumors (id INTEGER PRIMARY KEY)');
		initQuestlineTables(db);
		initQuestlineTables(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'questlines'").get()?.c ??
					0,
			),
			1,
		);
	});
});
