import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { captureRumor } from './capture_rumor.ts';
import { dismissRumor } from './dismiss_rumor.ts';
import { settleRumor } from './settle_rumor.ts';
import { softDeleteRumor } from './soft_delete_rumor.ts';
import { updateRumor } from './update_rumor.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('updateRumor', () => {
	it('updates details on an open rumor', () => {
		const r = captureRumor(db, { title: 'Auth latency', now: 1 });
		const updated = updateRumor(db, r.id, { details: 'P99 spiking after deploy', now: 2 });
		strictEqual(updated.details, 'P99 spiking after deploy');
		strictEqual(updated.title, 'Auth latency');
	});

	it('updates title on an open rumor', () => {
		const r = captureRumor(db, { title: 'Vague title', now: 1 });
		const updated = updateRumor(db, r.id, { title: 'Auth latency spike', now: 2 });
		strictEqual(updated.title, 'Auth latency spike');
		strictEqual(updated.details, null);
	});

	it('updates both title and details', () => {
		const r = captureRumor(db, { title: 'Old', details: 'Old details', now: 1 });
		const updated = updateRumor(db, r.id, {
			title: 'New',
			details: 'New details with more context',
			now: 2,
		});
		strictEqual(updated.title, 'New');
		strictEqual(updated.details, 'New details with more context');
	});

	it('advances updatedAt', () => {
		const r = captureRumor(db, { title: 'Signal', now: 1 });
		strictEqual(r.updatedAt, 1);
		const updated = updateRumor(db, r.id, { details: 'More context', now: 99 });
		strictEqual(updated.updatedAt, 99);
	});

	it('preserves existing details when only title is provided', () => {
		const r = captureRumor(db, { title: 'Title', details: 'Keep this', now: 1 });
		const updated = updateRumor(db, r.id, { title: 'New title', now: 2 });
		strictEqual(updated.details, 'Keep this');
	});

	it('preserves existing title when only details is provided', () => {
		const r = captureRumor(db, { title: 'Keep this', now: 1 });
		const updated = updateRumor(db, r.id, { details: 'New context', now: 2 });
		strictEqual(updated.title, 'Keep this');
	});

	it('throws if neither title nor details is provided', () => {
		const r = captureRumor(db, { title: 'Signal', now: 1 });
		throws(() => updateRumor(db, r.id, {}), /at least one/i);
	});

	it('throws if rumor is settled', () => {
		const r = captureRumor(db, { title: 'Done', now: 1 });
		settleRumor(db, r.id, {
			quests: [{ title: 'Task', objective: 'Do it' }],
			settledAt: 2,
		});
		throws(() => updateRumor(db, r.id, { details: 'Too late' }), /settled/i);
	});

	it('throws if rumor is dismissed', () => {
		const r = captureRumor(db, { title: 'Noise', now: 1 });
		dismissRumor(db, r.id, 2);
		throws(() => updateRumor(db, r.id, { details: 'Still noise' }), /dismissed/i);
	});

	it('throws if rumor is deleted', () => {
		const r = captureRumor(db, { title: 'Gone', now: 1 });
		softDeleteRumor(db, r.id);
		throws(() => updateRumor(db, r.id, { details: 'Too late' }), /not found/i);
	});

	it('rejects an empty title', () => {
		const r = captureRumor(db, { title: 'Signal', now: 1 });
		throws(() => updateRumor(db, r.id, { title: '   ' }), /Rumor title/i);
	});
});
