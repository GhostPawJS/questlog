import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { softDeleteQuest } from '../quests/soft_delete_quest.ts';
import { createRepeatableQuest } from './create_repeatable_quest.ts';
import { listDueRepeatableQuestAnchors } from './list_due_repeatable_quest_anchors.ts';
import { spawnDueRepeatableQuests } from './spawn_due_repeatable_quests.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listDueRepeatableQuestAnchors with soft-deleted spawns', () => {
	it('treats soft-deleted spawned quests as already materialized anchors', () => {
		const repeatable = createRepeatableQuest(db, {
			title: 'Daily walk',
			objective: 'Take the daily walk',
			rrule: 'FREQ=DAILY',
			anchorAt: 1_000,
			now: 10,
		});

		const spawnedBatch = spawnDueRepeatableQuests(db, 1_000);
		const spawnedQuest = spawnedBatch[0];
		if (!spawnedQuest) {
			throw new Error('expected spawned quest');
		}
		softDeleteQuest(db, spawnedQuest.id, 20);

		const anchors = listDueRepeatableQuestAnchors(db, 1_000);
		strictEqual(
			anchors.some((anchor) => anchor.repeatableQuestId === repeatable.id),
			false,
		);
		strictEqual(spawnDueRepeatableQuests(db, 1_000).length, 0);
	});

	it('marks every due anchor as repeatable available', () => {
		createRepeatableQuest(db, {
			title: 'Daily reading',
			objective: 'Read a chapter',
			rrule: 'FREQ=DAILY',
			anchorAt: 1_000,
			now: 10,
		});

		const [anchor] = listDueRepeatableQuestAnchors(db, 1_000);
		strictEqual(anchor?.markerId, 'attention.available.repeatable');
	});
});
