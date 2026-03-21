import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initRumorTables } from './init_rumor_tables';

describe('initRumorTables', () => {
	it('is idempotent on a bare connection', () => {
		const db = new DatabaseSync(':memory:');
		initRumorTables(db);
		initRumorTables(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'rumors'").get()?.c ?? 0,
			),
			1,
		);
	});
});
