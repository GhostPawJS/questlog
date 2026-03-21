import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { captureRumor } from './capture_rumor.ts';
import { listRumors } from './list_rumors.ts';
import { softDeleteRumor } from './soft_delete_rumor.ts';

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
