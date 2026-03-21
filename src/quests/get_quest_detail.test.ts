import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { addQuestReward } from '../rewards/add_quest_reward';
import { claimQuestReward } from '../rewards/claim_quest_reward';
import { createQuest } from './create_quest';
import { finishQuest } from './finish_quest';
import { getQuestDetail } from './get_quest_detail';
import { softDeleteQuest } from './soft_delete_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getQuestDetail', () => {
	it('returns a rich detail view including derived state for an existing quest', () => {
		const q = createQuest(db, { title: 'Ship', objective: 'Deploy', now: 10 });
		const d = getQuestDetail(db, q.id, 20);
		strictEqual(d.id, q.id);
		strictEqual(d.title, 'Ship');
		strictEqual(typeof d.state, 'string');
		strictEqual('markerId' in d, true);
		strictEqual(d.markerId, 'attention.available');
	});

	it('throws when the quest is missing or invisible to the detail query', () => {
		throws(() => getQuestDetail(db, 404, 1), /Quest 404 was not found/);
	});

	it('does not resolve soft-deleted quests', () => {
		const q = createQuest(db, { title: 'Gone', objective: 'Soon', now: 1 });
		softDeleteQuest(db, q.id, 2);
		throws(() => getQuestDetail(db, q.id, 3), new RegExp(`Quest ${q.id} was not found`));
	});

	it('shows turn-in pending only while a done quest still has an unclaimed reward', () => {
		const quest = createQuest(db, { title: 'Turn in', objective: 'Collect it', now: 1 });
		const reward = addQuestReward(db, quest.id, { kind: 'xp', name: 'XP', quantity: 10, now: 2 });

		finishQuest(db, quest.id, 'Done', 3);
		strictEqual(getQuestDetail(db, quest.id).markerId, 'progress.complete');

		claimQuestReward(db, reward.id, 4);
		strictEqual(getQuestDetail(db, quest.id).markerId, null);
	});
});
