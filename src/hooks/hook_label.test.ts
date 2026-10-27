import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { initQuestlogTables } from '../init_questlog_tables.ts';
import { hookLabel } from './hook_label.ts';

test('default label reveals only a basename and explicit labels persist', () => {
	const dir = mkdtempSync(join(tmpdir(), 'questlog-label-'));
	const db = new DatabaseSync(join(dir, 'work.sqlite'));
	try {
		initQuestlogTables(db);
		assert.equal(hookLabel(db), 'work');
		assert.equal(hookLabel(db, 'team'), 'team');
		assert.equal(hookLabel(db), 'team');
	} finally {
		db.close();
		rmSync(dir, { recursive: true });
	}
	const memory = new DatabaseSync(':memory:');
	try {
		initQuestlogTables(memory);
		assert.equal(hookLabel(memory), 'questlog');
	} finally {
		memory.close();
	}
});
