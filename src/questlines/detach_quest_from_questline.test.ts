import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { createQuestline } from './create_questline.ts';
import { detachQuestFromQuestline } from './detach_quest_from_questline.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('detachQuestFromQuestline', () => {
	it('clears questline_id on an active quest', () => {
		const ql = createQuestline(db, { title: 'L', now: 1 });
		const q = createQuest(db, { title: 'Q', objective: 'o', questlineId: ql.id, now: 2 });
		detachQuestFromQuestline(db, q.id, 3);
		const row = db.prepare('SELECT questline_id FROM quests WHERE id = ?').get(q.id) as {
			questline_id: number | null;
		};
		strictEqual(row.questline_id, null);
	});

	it('throws when the quest does not exist', () => {
		throws(() => detachQuestFromQuestline(db, 404), /Quest 404 was not found/);
	});
});
