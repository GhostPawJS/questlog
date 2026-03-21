import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createRepeatableQuest } from './create_repeatable_quest';
import { listDueRepeatableQuestAnchors } from './list_due_repeatable_quest_anchors';
import { spawnDueRepeatableQuests } from './spawn_due_repeatable_quests';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('spawnDueRepeatableQuests', () => {
	it('spawns concrete quests with copied tags and rewards', () => {
		const repeatable = createRepeatableQuest(db, {
			title: 'Daily pushups',
			objective: 'Do the planned pushups',
			rrule: 'FREQ=DAILY',
			anchorAt: 1_000,
			dueOffsetSeconds: 3_600,
			tags: ['fitness', 'daily'],
			rewards: [{ kind: 'xp', name: 'XP', quantity: 5 }],
			now: 10,
		});

		const anchors = listDueRepeatableQuestAnchors(db, 1_000 + 2 * 86_400_000);
		strictEqual(anchors.length, 3);

		const spawned = spawnDueRepeatableQuests(db, 1_000 + 2 * 86_400_000);
		strictEqual(spawned.length, 3);
		deepStrictEqual(
			spawned.map((quest) => quest.spawnedFromRepeatableId),
			[repeatable.id, repeatable.id, repeatable.id],
		);

		const firstSpawned = spawned[0];
		if (!firstSpawned) {
			throw new Error('expected at least one spawned quest');
		}
		const tagRows = db
			.prepare(
				`SELECT COUNT(*) AS total
         FROM quest_tags
         WHERE quest_id = ? AND deleted_at IS NULL`,
			)
			.get(firstSpawned.id);
		strictEqual(Number(tagRows?.total ?? 0), 2);

		const rewardRows = db
			.prepare(
				`SELECT COUNT(*) AS total
         FROM quest_rewards
         WHERE quest_id = ? AND deleted_at IS NULL`,
			)
			.get(firstSpawned.id);
		strictEqual(Number(rewardRows?.total ?? 0), 1);

		const spawnedAgain = spawnDueRepeatableQuests(db, 1_000 + 2 * 86_400_000);
		strictEqual(spawnedAgain.length, 0);
	});
});
