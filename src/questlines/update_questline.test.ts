import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuestline } from './create_questline.ts';
import { updateQuestline } from './update_questline.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('updateQuestline', () => {
	it('updates mutable fields transactionally', () => {
		const ql = createQuestline(db, { title: 'T', description: 'd', now: 1 });
		const next = updateQuestline(db, ql.id, {
			title: ' Renamed ',
			description: ' next ',
			startsAt: 10,
			dueAt: 20,
			now: 5,
		});
		strictEqual(next.title, 'Renamed');
		strictEqual(next.description, 'next');
		strictEqual(next.startsAt, 10);
		strictEqual(next.dueAt, 20);
	});

	it('rejects an empty title', () => {
		const ql = createQuestline(db, { title: 'Ok', now: 1 });
		throws(() => updateQuestline(db, ql.id, { title: '   ', now: 2 }), /Questline title/);
	});
});
