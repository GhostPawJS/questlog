import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { getQuestDetail } from './get_quest_detail';
import { softDeleteQuest } from './soft_delete_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getQuestDetail', () => {
	it('returns a rich detail view including derived state for an existing quest', () => {
		const q = createQuest(db, { title: 'Ship', objective: 'Deploy', now: 10 });
		const d = getQuestDetail(db, q.id, 20);
		strictEqual(d.id, q.id);
		strictEqual(d.title, 'Ship');
		strictEqual(typeof d.state, 'string');
	});

	it('throws when the quest is missing or invisible to the detail query', () => {
		throws(() => getQuestDetail(db, 404, 1), /Quest 404 was not found/);
	});

	it('does not resolve soft-deleted quests', () => {
		const q = createQuest(db, { title: 'Gone', objective: 'Soon', now: 1 });
		softDeleteQuest(db, q.id, 2);
		throws(() => getQuestDetail(db, q.id, 3), new RegExp(`Quest ${q.id} was not found`));
	});
});
