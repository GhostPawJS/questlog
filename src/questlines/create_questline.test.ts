import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { archiveQuestline } from './archive_questline';
import { createQuestline } from './create_questline';
import { updateQuestline } from './update_questline';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('createQuestline / updateQuestline / archiveQuestline', () => {
	it('creates, updates, and archives a questline', () => {
		const questline = createQuestline(db, { title: 'Launch', dueAt: 1000, now: 10 });
		strictEqual(questline.title, 'Launch');
		strictEqual(questline.dueAt, 1000);

		const updated = updateQuestline(db, questline.id, {
			description: 'Ship the new release.',
			startsAt: 500,
			now: 20,
		});
		strictEqual(updated.description, 'Ship the new release.');
		strictEqual(updated.startsAt, 500);

		const archived = archiveQuestline(db, questline.id, 30);
		strictEqual(archived.archivedAt, 30);
	});
});
