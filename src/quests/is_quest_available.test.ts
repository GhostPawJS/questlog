import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { addUnlock } from '../unlocks/add_unlock.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';
import { getQuestOrThrow } from './get_quest_or_throw.ts';
import { isQuestAvailable } from './is_quest_available.ts';
import { mapQuestRow } from './map_quest_row.ts';
import { planQuestTime } from './plan_quest_time.ts';
import { softDeleteQuest } from './soft_delete_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('isQuestAvailable', () => {
	it('is false for deleted or resolved quests', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const del = createQuest(db, { title: 'D', objective: 'd', now: 1 });
		softDeleteQuest(db, del.id, 2);
		const delRow = db.prepare('SELECT * FROM quests WHERE id = ?').get(del.id);
		strictEqual(delRow != null, true);
		strictEqual(isQuestAvailable(db, mapQuestRow(delRow as Record<string, unknown>), 10), false);

		finishQuest(db, a.id, 'ok', 3);
		strictEqual(isQuestAvailable(db, getQuestOrThrow(db, a.id), 10), false);
	});

	it('is false until not-before time', () => {
		const q = createQuest(db, { title: 'Later', objective: 'x', now: 1 });
		planQuestTime(db, q.id, { notBeforeAt: 100, now: 2 });
		const cur = getQuestOrThrow(db, q.id);
		strictEqual(isQuestAvailable(db, cur, 50), false);
		strictEqual(isQuestAvailable(db, getQuestOrThrow(db, q.id), 100), true);
	});

	it('is false while any prerequisite quest is not successfully resolved', () => {
		const pre = createQuest(db, { title: 'P', objective: 'p', now: 1 });
		const next = createQuest(db, { title: 'N', objective: 'n', now: 1 });
		addUnlock(db, pre.id, next.id, 2);
		strictEqual(isQuestAvailable(db, getQuestOrThrow(db, next.id), 10), false);
		finishQuest(db, pre.id, 'done', 5);
		strictEqual(isQuestAvailable(db, getQuestOrThrow(db, next.id), 10), true);
	});
});
