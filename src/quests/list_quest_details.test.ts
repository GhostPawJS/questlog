import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listQuestDetails } from './list_quest_details';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listQuestDetails', () => {
	it('returns one detail per active quest by default', () => {
		createQuest(db, { title: 'One', objective: 'a', now: 1 });
		createQuest(db, { title: 'Two', objective: 'b', now: 2 });
		const rows = listQuestDetails(db, {}, 10);
		strictEqual(rows.length, 2);
	});

	it('respects tag filters when provided', () => {
		createQuest(db, {
			title: 'Tagged',
			objective: 'x',
			tags: ['alpha'],
			now: 1,
		});
		createQuest(db, { title: 'Other', objective: 'y', tags: ['beta'], now: 2 });
		const rows = listQuestDetails(db, { tagNames: ['alpha'] }, 10);
		strictEqual(rows.length, 1);
		strictEqual(rows[0]?.title, 'Tagged');
	});
});
