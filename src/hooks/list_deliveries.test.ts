import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { addHook } from './add_hook.ts';
import { listDeliveries } from './list_deliveries.ts';
import { testHook } from './test_hook.ts';

test('retains 500 delivered entries per target and never prunes failed entries', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const { id } = addHook(db, { url: 'https://example.org', now: 1 });
		const sender: typeof fetch = async () => new Response(null, { status: 204 });
		await testHook(db, id, { now: 2, fetch: async () => new Response(null, { status: 500 }) });
		db.prepare("UPDATE hook_deliveries SET status = 'failed'").run();
		for (let i = 0; i < 502; i++) await testHook(db, id, { now: i + 3, fetch: sender });
		assert.equal(listDeliveries(db, { includeDelivered: true }).length, 501);
		assert.equal(listDeliveries(db)[0]?.status, 'failed');
	} finally {
		db.close();
	}
});
