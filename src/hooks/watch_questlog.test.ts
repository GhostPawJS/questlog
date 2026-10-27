import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { watchQuestlog } from './watch_questlog.ts';

test('watch completes its current tick and stops on injected cancellation', async () => {
	const db = await createInitializedQuestlogDb();
	try {
		const controller = new AbortController();
		let ticks = 0;
		await watchQuestlog(db, {
			interval: 5,
			signal: controller.signal,
			onTick: () => {
				ticks++;
				controller.abort();
			},
		});
		assert.equal(ticks, 1);
		await assert.rejects(
			watchQuestlog(db, { interval: 0.01, signal: controller.signal }),
			/at least 5/,
		);
	} finally {
		db.close();
	}
});
