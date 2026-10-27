import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { initQuestlogTables } from '../init_questlog_tables.ts';
import { createQuest } from '../quests/create_quest.ts';
import { initHookTables } from './init_hook_tables.ts';

test('existing 0.9-shaped databases gain webhook tables without changing work', () => {
	const db = new DatabaseSync(':memory:');
	try {
		initQuestlogTables(db);
		const q = createQuest(db, { title: 'existing', objective: 'existing' });
		db.exec(
			'DROP TABLE hook_assignments; DROP TABLE hook_deliveries; DROP TABLE hook_events; DROP TABLE hook_targets; DROP TABLE hook_settings;',
		);
		initQuestlogTables(db);
		initHookTables(db);
		assert.equal(db.prepare('SELECT title FROM quests WHERE id = ?').get(q.id)?.title, 'existing');
		assert.equal(db.prepare('SELECT COUNT(*) AS n FROM hook_targets').get()?.n, 0);
	} finally {
		db.close();
	}
});
