import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { archiveQuestline } from './archive_questline.ts';
import { createQuestline } from './create_questline.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('archiveQuestline', () => {
	it('sets archived_at while keeping the questline readable', () => {
		const ql = createQuestline(db, { title: 'Season', now: 1 });
		const archived = archiveQuestline(db, ql.id, 99);
		strictEqual(archived.archivedAt, 99);
		strictEqual(archived.id, ql.id);
	});
});
