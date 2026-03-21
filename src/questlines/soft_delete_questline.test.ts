import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuestline } from './create_questline';
import { listQuestlines } from './list_questlines';
import { softDeleteQuestline } from './soft_delete_questline';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('softDeleteQuestline', () => {
	it('excludes soft-deleted questlines from default reads', () => {
		const questline = createQuestline(db, { title: 'Archive me', now: 10 });
		softDeleteQuestline(db, questline.id, 20);
		strictEqual(
			listQuestlines(db).some((listedQuestline) => listedQuestline.id === questline.id),
			false,
		);
	});
});
