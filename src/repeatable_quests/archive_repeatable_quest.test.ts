import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { archiveRepeatableQuest } from './archive_repeatable_quest';
import { createRepeatableQuest } from './create_repeatable_quest';

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
