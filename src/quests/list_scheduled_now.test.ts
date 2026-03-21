import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { listScheduledNow } from './list_scheduled_now.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listScheduledNow', () => {
	it('returns quests whose scheduled window contains the instant `now`', () => {
		const now = 1_500;
		createQuest(db, {
			title: 'Now',
			objective: 'n',
			scheduledStartAt: 1_000,
			scheduledEndAt: 2_000,
			now: 1,
		});
		const rows = listScheduledNow(db, {}, now);
		strictEqual(
			rows.some((q) => q.title === 'Now'),
			true,
		);
	});
});
