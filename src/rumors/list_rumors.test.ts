import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { captureRumor } from './capture_rumor';
import { dismissRumor } from './dismiss_rumor';
import { listRumors } from './list_rumors';
import { softDeleteRumor } from './soft_delete_rumor';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listRumors', () => {
	it('orders newest first and skips soft-deleted rows', () => {
		const a = captureRumor(db, { title: 'A', now: 1 });
		const b = captureRumor(db, { title: 'B', now: 5 });
		softDeleteRumor(db, a.id, 10);
		const rows = listRumors(db);
		strictEqual(rows.length, 1);
		strictEqual(rows[0]?.id, b.id);
		strictEqual(rows[0]?.markerId, 'attention.available');
	});

	it('keeps markerId present and null for dismissed rumors', () => {
		const rumor = captureRumor(db, { title: 'Maybe not', now: 1 });
		dismissRumor(db, rumor.id, 2);

		const [row] = listRumors(db);
		strictEqual('markerId' in (row ?? {}), true);
		strictEqual(row?.markerId, null);
	});
});
