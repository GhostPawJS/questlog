import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuestline } from './create_questline.ts';
import { getQuestlineOrThrow } from './get_questline_or_throw.ts';
import { softDeleteQuestline } from './soft_delete_questline.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getQuestlineOrThrow', () => {
	it('loads an active questline by id', () => {
		const ql = createQuestline(db, { title: 'Epic', now: 1 });
		const got = getQuestlineOrThrow(db, ql.id);
		strictEqual(got.id, ql.id);
		strictEqual(got.title, 'Epic');
	});

	it('throws when missing', () => {
		throws(() => getQuestlineOrThrow(db, 999_999), /Questline 999999 was not found/);
	});

	it('ignores soft-deleted questlines', () => {
		const ql = createQuestline(db, { title: 'Old', now: 1 });
		softDeleteQuestline(db, ql.id, 2);
		throws(() => getQuestlineOrThrow(db, ql.id), new RegExp(`Questline ${ql.id} was not found`));
	});
});
