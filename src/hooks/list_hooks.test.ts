import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { addHook } from './add_hook.ts';
import { listHooks } from './list_hooks.ts';

test('lists redacted targets with scope and filters, never secrets', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		addHook(db, {
			url: 'https://user:password@example.org/wake?private=value#fragment',
			secret: 'sentinel',
			tag: 'Work',
			events: ['quest.due'],
			now: 1,
		});
		const targets = listHooks(db);
		assert.equal(targets[0]?.url, 'https://example.org/wake');
		assert.equal(targets[0]?.tag, 'work');
		assert.deepEqual(targets[0]?.events, ['quest.due']);
		assert.ok(!JSON.stringify(targets).includes('sentinel'));
	} finally {
		db.close();
	}
});
