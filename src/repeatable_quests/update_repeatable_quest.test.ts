import { throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createRepeatableQuest } from './create_repeatable_quest.ts';
import { updateRepeatableQuest } from './update_repeatable_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('updateRepeatableQuest (edge cases)', () => {
	it('rejects an empty title', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			now: 10,
		});
		throws(
			() => updateRepeatableQuest(db, rq.id, { title: '   ', now: 20 }),
			/Repeatable quest title/,
		);
	});
});
