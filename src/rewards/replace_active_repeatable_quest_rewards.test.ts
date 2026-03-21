import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest.ts';
import { replaceActiveRepeatableQuestRewards } from './replace_active_repeatable_quest_rewards.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceActiveRepeatableQuestRewards', () => {
	it('replaces templates on a repeatable quest', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			rewards: [{ kind: 'xp', name: 'Old', quantity: 1 }],
			now: 10,
		});
		replaceActiveRepeatableQuestRewards(db, rq.id, [{ kind: 'xp', name: 'New', quantity: 3 }], 20);
		const rows = db
			.prepare(
				'SELECT name FROM repeatable_quest_rewards WHERE repeatable_quest_id = ? AND deleted_at IS NULL',
			)
			.all(rq.id) as { name: string }[];
		strictEqual(rows.length, 1);
		strictEqual(rows[0]?.name, 'New');
	});
});
