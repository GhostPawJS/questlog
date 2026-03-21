import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest';
import { replaceRepeatableQuestRewards } from './replace_repeatable_quest_rewards';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceRepeatableQuestRewards', () => {
	it('requires the repeatable quest to exist', () => {
		throws(() => replaceRepeatableQuestRewards(db, 404, [], 1), /Repeatable quest 404/);
	});

	it('bumps repeatable_quests.updated_at after replacing templates', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			now: 10,
		});
		replaceRepeatableQuestRewards(db, rq.id, [{ kind: 'xp', name: 'X', quantity: 1 }], 50);
		const updatedAt = Number(
			db.prepare('SELECT updated_at FROM repeatable_quests WHERE id = ?').get(rq.id)?.updated_at ??
				0,
		);
		strictEqual(updatedAt, 50);
	});
});
