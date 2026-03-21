import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest';
import { replaceActiveRepeatableQuestTags } from './replace_active_repeatable_quest_tags';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceActiveRepeatableQuestTags', () => {
	it('replaces repeatable tag templates', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			tags: ['old'],
			now: 10,
		});
		replaceActiveRepeatableQuestTags(db, rq.id, ['new'], 20);
		const rows = db
			.prepare(
				`SELECT t.name
         FROM repeatable_quest_tags rqt
         JOIN tags t ON t.id = rqt.tag_id
         WHERE rqt.repeatable_quest_id = ? AND rqt.deleted_at IS NULL`,
			)
			.all(rq.id) as { name: string }[];
		strictEqual(rows.length, 1);
		strictEqual(rows[0]?.name, 'new');
	});
});
