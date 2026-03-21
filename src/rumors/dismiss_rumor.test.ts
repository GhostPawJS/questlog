import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { captureRumor } from './capture_rumor';
import { dismissRumor } from './dismiss_rumor';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('dismissRumor', () => {
	it('sets dismissed_at and clears settled_at', () => {
		const r = captureRumor(db, { title: 'Noise', now: 1 });
		db.prepare('UPDATE rumors SET settled_at = 5 WHERE id = ?').run(r.id);
		const next = dismissRumor(db, r.id, 10);
		strictEqual(next.dismissedAt, 10);
		strictEqual(next.settledAt, null);
	});
});
