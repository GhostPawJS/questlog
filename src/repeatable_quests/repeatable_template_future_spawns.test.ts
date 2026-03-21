import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { getQuestDetail } from '../quests/get_quest_detail.ts';
import { replaceRepeatableQuestRewards } from '../rewards/replace_repeatable_quest_rewards.ts';
import { replaceRepeatableQuestTags } from '../tags/replace_repeatable_quest_tags.ts';
import { createRepeatableQuest } from './create_repeatable_quest.ts';
import { listDueRepeatableQuestAnchors } from './list_due_repeatable_quest_anchors.ts';
import { spawnDueRepeatableQuests } from './spawn_due_repeatable_quests.ts';
import { updateRepeatableQuest } from './update_repeatable_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('repeatable template edits vs future spawns', () => {
	it('applies repeatable definition and template edits only to future spawns', () => {
		const repeatable = createRepeatableQuest(db, {
			title: 'Daily pushups',
			objective: 'Do the planned pushups',
			rrule: 'FREQ=DAILY',
			anchorAt: 1_000,
			tags: ['fitness'],
			rewards: [{ kind: 'xp', name: 'XP', quantity: 5 }],
			now: 10,
		});

		const firstBatch = spawnDueRepeatableQuests(db, 1_000);
		const firstQuest = firstBatch[0];
		if (!firstQuest) {
			throw new Error('expected first spawned quest');
		}
		updateRepeatableQuest(db, repeatable.id, {
			title: 'Weekly pushups',
			objective: 'Do the weekly pushups',
			rrule: 'FREQ=WEEKLY;BYDAY=MO',
			now: 20,
		});
		replaceRepeatableQuestTags(db, repeatable.id, ['strength'], 30);
		replaceRepeatableQuestRewards(
			db,
			repeatable.id,
			[{ kind: 'badge', name: 'Consistency', quantity: 1 }],
			40,
		);

		const anchors = listDueRepeatableQuestAnchors(db, 1_000 + 8 * 86_400_000);
		strictEqual(anchors.length, 1);

		const secondBatch = spawnDueRepeatableQuests(db, 1_000 + 8 * 86_400_000);
		const secondQuest = secondBatch[0];
		if (!secondQuest) {
			throw new Error('expected second spawned quest');
		}
		const firstDetail = getQuestDetail(db, firstQuest.id);
		const secondDetail = getQuestDetail(db, secondQuest.id);

		strictEqual(firstDetail.title, 'Daily pushups');
		strictEqual(firstDetail.objective, 'Do the planned pushups');
		deepStrictEqual(firstDetail.tagNames, ['fitness']);
		strictEqual(firstDetail.rewards[0]?.name, 'XP');
		strictEqual(firstDetail.rewards[0]?.quantity, 5);

		strictEqual(secondDetail.title, 'Weekly pushups');
		strictEqual(secondDetail.objective, 'Do the weekly pushups');
		deepStrictEqual(secondDetail.tagNames, ['strength']);
		strictEqual(secondDetail.rewards[0]?.name, 'Consistency');
		strictEqual(secondDetail.rewards[0]?.quantity, 1);
	});
});
