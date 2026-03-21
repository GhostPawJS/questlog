import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { finishQuest } from '../quests/finish_quest.ts';
import { addQuestReward } from './add_quest_reward.ts';
import { claimQuestReward } from './claim_quest_reward.ts';
import { updateQuestReward } from './update_quest_reward.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('updateQuestReward', () => {
	it('updates an unclaimed reward and touches the parent quest timestamp', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		const rw = addQuestReward(db, q.id, { kind: 'xp', name: 'Old', quantity: 1, now: 2 });
		const next = updateQuestReward(db, rw.id, { kind: 'loot', name: 'Chest', quantity: 2, now: 9 });
		strictEqual(next.kind, 'loot');
		strictEqual(next.name, 'Chest');
		const questUpdated = Number(
			db.prepare('SELECT updated_at FROM quests WHERE id = ?').get(q.id)?.updated_at ?? 0,
		);
		strictEqual(questUpdated, 9);
	});

	it('refuses to change claimed rewards', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		const rw = addQuestReward(db, q.id, { kind: 'xp', name: 'X', quantity: 1, now: 2 });
		finishQuest(db, q.id, 'ok', 3);
		claimQuestReward(db, rw.id, 4);
		throws(
			() => updateQuestReward(db, rw.id, { kind: 'xp', name: 'Y', quantity: 1, now: 5 }),
			/Claimed rewards cannot be updated/,
		);
	});
});
