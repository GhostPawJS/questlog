import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { addQuestReward } from './add_quest_reward.ts';
import { getQuestRewardOrThrow } from './get_quest_reward_or_throw.ts';
import { removeQuestReward } from './remove_quest_reward.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getQuestRewardOrThrow', () => {
	it('returns an active reward row', () => {
		const q = createQuest(db, { title: 'Q', objective: 'O', now: 1 });
		const rw = addQuestReward(db, q.id, { kind: 'xp', name: 'X', quantity: 1, now: 2 });
		const got = getQuestRewardOrThrow(db, rw.id);
		strictEqual(got.id, rw.id);
		strictEqual(got.name, 'X');
	});

	it('throws when the reward id does not exist', () => {
		throws(() => getQuestRewardOrThrow(db, 123_456), /Quest reward 123456 was not found/);
	});

	it('does not return soft-removed rewards', () => {
		const q = createQuest(db, { title: 'Q', objective: 'O', now: 1 });
		const rw = addQuestReward(db, q.id, { kind: 'xp', name: 'Y', quantity: 1, now: 2 });
		removeQuestReward(db, rw.id, 3);
		throws(
			() => getQuestRewardOrThrow(db, rw.id),
			new RegExp(`Quest reward ${rw.id} was not found`),
		);
	});
});
