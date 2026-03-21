import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { archiveRepeatableQuest } from './archive_repeatable_quest.ts';
import { createRepeatableQuest } from './create_repeatable_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('archiveRepeatableQuest', () => {
	it('sets archived_at on the definition', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Daily',
			objective: 'd',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			now: 10,
		});
		const next = archiveRepeatableQuest(db, rq.id, 50);
		strictEqual(next.archivedAt, 50);
	});
});
