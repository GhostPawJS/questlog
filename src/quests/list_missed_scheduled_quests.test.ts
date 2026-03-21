import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listMissedScheduledQuests } from './list_missed_scheduled_quests';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listMissedScheduledQuests', () => {
	it('lists unresolved quests whose scheduled end is already in the past', () => {
		createQuest(db, {
			title: 'Missed',
			objective: 'm',
			scheduledStartAt: 100,
			scheduledEndAt: 200,
			now: 1,
		});
		const rows = listMissedScheduledQuests(db, {}, 500);
		strictEqual(
			rows.some((q) => q.title === 'Missed'),
			true,
		);
	});
});
