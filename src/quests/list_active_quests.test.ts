import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';
import { listActiveQuests } from './list_active_quests.ts';
import { startQuest } from './start_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listActiveQuests', () => {
	it('includes open and in-progress quests but not terminal ones', () => {
		const open = createQuest(db, { title: 'O', objective: 'o', now: 1 });
		const run = createQuest(db, { title: 'R', objective: 'r', now: 1 });
		startQuest(db, run.id, 2);
		const done = createQuest(db, { title: 'D', objective: 'd', now: 1 });
		finishQuest(db, done.id, 'x', 3);
		const rows = listActiveQuests(db, {}, 10);
		strictEqual(
			rows.some((q) => q.id === open.id),
			true,
		);
		strictEqual(
			rows.some((q) => q.id === run.id),
			true,
		);
		strictEqual(
			rows.some((q) => q.id === done.id),
			false,
		);
	});
});
