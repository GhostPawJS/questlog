import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest';
import { copyRepeatableQuestTagsToQuest } from './copy_repeatable_quest_tags_to_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('copyRepeatableQuestTagsToQuest', () => {
	it('copies active repeatable tag links onto a concrete quest', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			tags: ['habit', 'health'],
			now: 10,
		});
		const q = createQuest(db, { title: 'Spawn', objective: 's', now: 20 });
		copyRepeatableQuestTagsToQuest(db, rq.id, q.id, 30);
		const rows = db
			.prepare(
				`SELECT t.name
         FROM quest_tags qt
         JOIN tags t ON t.id = qt.tag_id
         WHERE qt.quest_id = ? AND qt.deleted_at IS NULL`,
			)
			.all(q.id) as { name: string }[];
		strictEqual(rows.length, 2);
		strictEqual(new Set(rows.map((r) => r.name)).has('habit'), true);
	});
});
