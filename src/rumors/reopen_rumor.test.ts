import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { captureRumor } from './capture_rumor';
import { dismissRumor } from './dismiss_rumor';
import { reopenRumor } from './reopen_rumor';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('reopenRumor', () => {
	it('clears dismissal and settlement timestamps', () => {
		const r = captureRumor(db, { title: 'R', now: 1 });
		dismissRumor(db, r.id, 6);
		const next = reopenRumor(db, r.id, 20);
		strictEqual(next.settledAt, null);
		strictEqual(next.dismissedAt, null);
	});
});
