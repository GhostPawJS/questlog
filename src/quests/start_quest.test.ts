import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';
import { startQuest } from './start_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('startQuest', () => {
	it('is safe to call twice: second call returns without moving started_at backward', () => {
		const q = createQuest(db, { title: 'S', objective: 's', now: 1 });
		const first = startQuest(db, q.id, 10);
		const second = startQuest(db, q.id, 999);
		strictEqual(second.startedAt, first.startedAt);
	});

	it('refuses to start a resolved quest', () => {
		const q = createQuest(db, { title: 'D', objective: 'd', now: 1 });
		finishQuest(db, q.id, 'done', 5);
		throws(() => startQuest(db, q.id, 6), /Resolved quests cannot be started/);
	});
});
