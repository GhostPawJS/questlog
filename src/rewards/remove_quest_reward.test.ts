import { throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { finishQuest } from '../quests/finish_quest.ts';
import { addQuestReward } from './add_quest_reward.ts';
import { claimQuestReward } from './claim_quest_reward.ts';
import { removeQuestReward } from './remove_quest_reward.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('removeQuestReward', () => {
	it('does not remove claimed rewards', () => {
		const quest = createQuest(db, { title: 'Quest', objective: 'Do it', now: 10 });
		const reward = addQuestReward(db, quest.id, { kind: 'xp', name: 'XP', quantity: 5, now: 20 });
		finishQuest(db, quest.id, 'Done.', 30);
		claimQuestReward(db, reward.id, 40);
		throws(() => removeQuestReward(db, reward.id, 50), /Claimed rewards cannot be removed/);
	});
});
