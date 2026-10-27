import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { addHook } from './add_hook.ts';
import { removeHook } from './remove_hook.ts';
import { tickQuestlog } from './tick_questlog.ts';

test('removes a target, queued assignments, and delivery history', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const { id } = addHook(db, { url: 'https://example.org', now: 1 });
		createQuest(db, { title: 'due', objective: 'due', dueAt: 2, now: 1 });
		await tickQuestlog(db, { now: 2, fetch: async () => new Response(null, { status: 500 }) });
		removeHook(db, id);
		for (const table of ['hook_targets', 'hook_deliveries', 'hook_assignments'])
			assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n, 0);
	} finally {
		db.close();
	}
});
