import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { softDeleteQuest } from '../quests/soft_delete_quest';
import { createRepeatableQuest } from './create_repeatable_quest';
import { listDueRepeatableQuestAnchors } from './list_due_repeatable_quest_anchors';
import { spawnDueRepeatableQuests } from './spawn_due_repeatable_quests';

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
});
