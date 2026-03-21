import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { finishQuest } from './finish_quest';

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
