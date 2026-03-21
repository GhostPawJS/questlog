import { strictEqual } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { initRumorSearch } from './init_rumor_search.ts';
import { initRumorTables } from './init_rumor_tables.ts';

describe('initRumorSearch', () => {
	it('creates FTS5 and triggers idempotently on top of rumors', () => {
		const db = new DatabaseSync(':memory:');
		initRumorTables(db);
		initRumorSearch(db);
		initRumorSearch(db);
		strictEqual(
			Number(
				db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'rumors_fts'").get()?.c ??
					0,
			),
			1,
		);
	});
});
