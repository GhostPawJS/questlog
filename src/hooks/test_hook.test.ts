import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { addHook } from './add_hook.ts';
import { listDeliveries } from './list_deliveries.ts';
import { testHook } from './test_hook.ts';

test('test sends logged signed hook.test events even inside the min gap', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const { id } = addHook(db, { url: 'https://example.org', now: 1 });
		let sends = 0;
		const sender: typeof fetch = async (_url, init) => {
			sends++;
			assert.equal(JSON.parse(String(init?.body)).events[0].type, 'hook.test');
			return new Response(null, { status: 204 });
		};
		await testHook(db, id, { now: 2, fetch: sender });
		await testHook(db, id, { now: 3, fetch: sender });
		assert.equal(sends, 2);
		assert.equal(listDeliveries(db, { includeDelivered: true }).length, 2);
		await assert.rejects(testHook(db, 999), /not found/);
	} finally {
		db.close();
	}
});
