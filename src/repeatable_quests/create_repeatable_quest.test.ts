import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createRepeatableQuest } from './create_repeatable_quest.ts';
import { updateRepeatableQuest } from './update_repeatable_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('createRepeatableQuest / updateRepeatableQuest', () => {
	it('creates and updates a repeatable quest definition', () => {
		const repeatable = createRepeatableQuest(db, {
			title: 'Daily pushups',
			objective: 'Do the planned pushups',
			rrule: 'FREQ=DAILY',
			anchorAt: 1_000,
			dueOffsetSeconds: 3_600,
			tags: ['fitness'],
			rewards: [{ kind: 'xp', name: 'XP', quantity: 5 }],
			now: 10,
		});

		strictEqual(repeatable.title, 'Daily pushups');
		strictEqual(repeatable.dueOffsetSeconds, 3_600);

		const updated = updateRepeatableQuest(db, repeatable.id, {
			title: 'Daily pushups and mobility',
			rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
			now: 20,
		});
		strictEqual(updated.title, 'Daily pushups and mobility');
		strictEqual(updated.rrule, 'FREQ=WEEKLY;BYDAY=MO,WE,FR');
	});
});
