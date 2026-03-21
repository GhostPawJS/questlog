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

describe('addQuestReward / updateQuestReward / claimQuestReward', () => {
	it('adds, updates, removes, and claims rewards correctly', () => {
		const quest = createQuest(db, { title: 'Quest', objective: 'Do it', now: 10 });
		const reward = addQuestReward(db, quest.id, {
			kind: 'item',
			name: 'Potion',
			quantity: 2,
			now: 20,
		});
		strictEqual(reward.quantity, 2);

		const updated = updateQuestReward(db, reward.id, {
			kind: 'item',
			name: 'Mega Potion',
			quantity: 3,
			now: 30,
		});
		strictEqual(updated.name, 'Mega Potion');

		throws(() => claimQuestReward(db, reward.id, 40), /successfully resolved quests/);

		finishQuest(db, quest.id, 'Done.', 50);
		const claimed = claimQuestReward(db, reward.id, 60);
		strictEqual(claimed.claimedAt, 60);
		throws(() => claimQuestReward(db, reward.id, 70), /already been claimed/);
	});
});
