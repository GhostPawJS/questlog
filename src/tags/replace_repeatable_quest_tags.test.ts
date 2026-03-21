import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest.ts';
import { replaceRepeatableQuestTags } from './replace_repeatable_quest_tags.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceRepeatableQuestTags', () => {
	it('requires the repeatable quest to exist', () => {
		throws(() => replaceRepeatableQuestTags(db, 404, [], 1), /Repeatable quest 404/);
	});

	it('updates repeatable_quests.updated_at', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			now: 10,
		});
		replaceRepeatableQuestTags(db, rq.id, ['x'], 40);
		const updatedAt = Number(
			db.prepare('SELECT updated_at FROM repeatable_quests WHERE id = ?').get(rq.id)?.updated_at ??
				0,
		);
		strictEqual(updatedAt, 40);
	});
});
