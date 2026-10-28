import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { addHook } from './add_hook.ts';

test('validates targets and generates a 32-byte secret only at creation', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		for (const url of ['file:///tmp/x', 'ftp://example.org', 'invalid'])
			assert.throws(() => addHook(db, { url }), /HTTP|unsupported scheme/);
		assert.throws(() => addHook(db, { url: 'https://example.org', minGap: -1 }));
		assert.throws(() => addHook(db, { url: 'https://example.org', events: [] }));
		const target = addHook(db, { url: 'https://example.org' });
		assert.match(target.secret, /^[a-f0-9]{64}$/);
		assert.equal(addHook(db, { url: 'http://example.org', secret: 'supplied' }).secret, 'supplied');
	} finally {
		db.close();
	}
});
