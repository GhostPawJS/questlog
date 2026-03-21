import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('finishQuest', () => {
	it('is the success-shaped wrapper around resolveQuest', () => {
		const q = createQuest(db, { title: 'Build', objective: 'It', now: 1 });
		const done = finishQuest(db, q.id, 'Shipped', 9);
		strictEqual(done.success, true);
		strictEqual(done.outcome, 'Shipped');
	});
});
