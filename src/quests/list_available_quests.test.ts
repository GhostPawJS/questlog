import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { addUnlock } from '../unlocks/add_unlock.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';
import { listAvailableQuests } from './list_available_quests.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listAvailableQuests', () => {
	it('excludes quests blocked by incomplete prerequisites', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const b = createQuest(db, { title: 'B', objective: 'b', now: 1 });
		addUnlock(db, a.id, b.id, 2);
		const before = listAvailableQuests(db, {}, 10);
		strictEqual(
			before.some((q) => q.id === b.id),
			false,
		);
		finishQuest(db, a.id, 'done', 5);
		const after = listAvailableQuests(db, {}, 10);
		strictEqual(
			after.some((q) => q.id === b.id),
			true,
		);
	});
});
