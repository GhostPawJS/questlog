import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { finishQuest } from '../quests/finish_quest';
import { getQuestDetail } from '../quests/get_quest_detail';
import { addQuestReward } from './add_quest_reward';
import { claimQuestReward } from './claim_quest_reward';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('claimQuestReward', () => {
	it('sets claimed_at only when the quest is successfully resolved', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		const rw = addQuestReward(db, q.id, { kind: 'xp', name: 'X', quantity: 1, now: 2 });
		throws(() => claimQuestReward(db, rw.id, 3), /successfully resolved/);
		finishQuest(db, q.id, 'done', 4);
		strictEqual(getQuestDetail(db, q.id).markerId, 'progress.complete');
		const claimed = claimQuestReward(db, rw.id, 5);
		strictEqual(claimed.claimedAt, 5);
		strictEqual(getQuestDetail(db, q.id).markerId, null);
		throws(() => claimQuestReward(db, rw.id, 6), /already been claimed/);
	});
});
