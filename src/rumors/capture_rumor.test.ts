import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { captureRumor } from './capture_rumor.ts';
import { dismissRumor } from './dismiss_rumor.ts';
import { reopenRumor } from './reopen_rumor.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('captureRumor / dismissRumor / reopenRumor', () => {
	it('captures, dismisses, and reopens a rumor', () => {
		const rumor = captureRumor(db, {
			title: 'Refactor auth',
			details: 'Maybe after launch',
			now: 10,
		});
		strictEqual(rumor.title, 'Refactor auth');
		strictEqual(rumor.dismissedAt, null);
		strictEqual(rumor.markerId, 'attention.available');

		const dismissed = dismissRumor(db, rumor.id, 20);
		strictEqual(dismissed.dismissedAt, 20);
		strictEqual(dismissed.markerId, null);

		const reopened = reopenRumor(db, rumor.id, 30);
		strictEqual(reopened.dismissedAt, null);
		strictEqual(reopened.settledAt, null);
		strictEqual(reopened.markerId, 'attention.available');
	});

	it('rejects empty rumor titles', () => {
		throws(() => captureRumor(db, { title: '   ' }), /Rumor title must not be empty/);
	});
});
