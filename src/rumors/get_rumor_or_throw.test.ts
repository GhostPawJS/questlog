import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { captureRumor } from './capture_rumor';
import { getRumorOrThrow } from './get_rumor_or_throw';
import { softDeleteRumor } from './soft_delete_rumor';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getRumorOrThrow', () => {
	it('returns the rumor when present', () => {
		const r = captureRumor(db, { title: 'Tip', now: 1 });
		const got = getRumorOrThrow(db, r.id);
		strictEqual(got.title, 'Tip');
	});

	it('throws when missing or soft-deleted', () => {
		throws(() => getRumorOrThrow(db, 404), /Rumor 404 was not found/);
		const r = captureRumor(db, { title: 'Gone', now: 1 });
		softDeleteRumor(db, r.id, 2);
		throws(() => getRumorOrThrow(db, r.id), new RegExp(`Rumor ${r.id} was not found`));
	});
});
