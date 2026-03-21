import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { captureRumor } from './capture_rumor';
import { listRumors } from './list_rumors';
import { softDeleteRumor } from './soft_delete_rumor';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('softDeleteRumor', () => {
	it('excludes soft-deleted rumors from default reads', () => {
		const rumor = captureRumor(db, { title: 'Hide me', now: 10 });
		softDeleteRumor(db, rumor.id, 20);
		strictEqual(
			listRumors(db).some((listedRumor) => listedRumor.id === rumor.id),
			false,
		);
	});
});
