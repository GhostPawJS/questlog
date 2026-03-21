import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { getQuestDetail } from '../quests/get_quest_detail';
import { createRepeatableQuest } from './create_repeatable_quest';
import { spawnDueRepeatableQuests } from './spawn_due_repeatable_quests';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('spawnDueRepeatableQuests temporal fields', () => {
	it('copies temporal offsets and all-day scheduling into spawned quests without auto-starting them', () => {
		const repeatable = createRepeatableQuest(db, {
			title: 'Conference day',
			objective: 'Attend the whole conference day',
			rrule: 'FREQ=DAILY',
			anchorAt: 10_000,
			scheduledStartOffsetSeconds: 0,
			scheduledEndOffsetSeconds: 3_600,
			dueOffsetSeconds: 7_200,
			allDay: true,
			now: 10,
		});

		const spawnedBatch = spawnDueRepeatableQuests(db, 10_000);
		const spawnedQuest = spawnedBatch[0];
		if (!spawnedQuest) {
			throw new Error('expected spawned quest');
		}
		const detail = getQuestDetail(db, spawnedQuest.id, 10_500);

		strictEqual(detail.spawnedFromRepeatableId, repeatable.id);
		strictEqual(detail.spawnedForAt, 10_000);
		strictEqual(detail.scheduledStartAt, 10_000);
		strictEqual(detail.scheduledEndAt, 3_610_000);
		strictEqual(detail.dueAt, 7_210_000);
		strictEqual(detail.allDay, true);
		strictEqual(detail.startedAt, null);
		strictEqual(detail.state, 'open');
	});
});
