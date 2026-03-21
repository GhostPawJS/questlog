import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { createRepeatableQuest } from '../repeatable_quests/create_repeatable_quest.ts';
import { copyRepeatableQuestRewardsToQuest } from './copy_repeatable_quest_rewards_to_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('copyRepeatableQuestRewardsToQuest', () => {
	it('materializes active repeatable reward rows onto a concrete quest', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			rewards: [{ kind: 'badge', name: 'Streak', quantity: 1 }],
			now: 10,
		});
		const q = createQuest(db, { title: 'Spawn', objective: 's', now: 20 });
		copyRepeatableQuestRewardsToQuest(db, rq.id, q.id, 30);
		const rows = db
			.prepare('SELECT kind, name FROM quest_rewards WHERE quest_id = ? AND deleted_at IS NULL')
			.all(q.id) as { kind: string; name: string }[];
		strictEqual(rows.length, 1);
		strictEqual(rows[0]?.kind, 'badge');
		strictEqual(rows[0]?.name, 'Streak');
	});
});
