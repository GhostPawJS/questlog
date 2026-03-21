import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listScheduledForDay } from './list_scheduled_for_day';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listScheduledForDay', () => {
	it('filters by the UTC day window passed in', () => {
		const dayStart = Date.UTC(2024, 2, 10);
		const dayEnd = dayStart + 86_400_000;
		const t = dayStart + 36_000_000;
		createQuest(db, {
			title: 'Slot',
			objective: 's',
			scheduledStartAt: t,
			scheduledEndAt: t + 3_600_000,
			now: 1,
		});
		const rows = listScheduledForDay(db, dayStart, dayEnd, {}, dayEnd + 1);
		strictEqual(
			rows.some((q) => q.title === 'Slot'),
			true,
		);
	});
});
