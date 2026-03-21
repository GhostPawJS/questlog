import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { createQuestline } from './create_questline';
import { getQuestlineDetail } from './get_questline_detail';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getQuestlineDetail', () => {
	it('joins questline row with aggregate stats for that chain', () => {
		const ql = createQuestline(db, { title: 'Sprint', now: 1 });
		createQuest(db, { title: 'A', objective: 'a', questlineId: ql.id, now: 2 });
		createQuest(db, { title: 'B', objective: 'b', questlineId: ql.id, now: 3 });
		const d = getQuestlineDetail(db, ql.id, 10);
		strictEqual(d.id, ql.id);
		strictEqual(d.totalQuests, 2);
		strictEqual(d.title, 'Sprint');
	});
});
