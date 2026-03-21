import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createRepeatableQuest } from './create_repeatable_quest';
import { softDeleteRepeatableQuest } from './soft_delete_repeatable_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('softDeleteRepeatableQuest', () => {
	it('soft-deletes an active repeatable quest', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			now: 10,
		});
		softDeleteRepeatableQuest(db, rq.id, 20);
		const row = db.prepare('SELECT deleted_at FROM repeatable_quests WHERE id = ?').get(rq.id) as {
			deleted_at: number | null;
		};
		strictEqual(row.deleted_at, 20);
	});

	it('rejects a repeat call when already deleted', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			now: 10,
		});
		softDeleteRepeatableQuest(db, rq.id, 20);
		throws(() => softDeleteRepeatableQuest(db, rq.id, 30), /Repeatable quest \d+ was not found/);
	});
});
