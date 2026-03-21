import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { getQuestOrThrow } from './get_quest_or_throw.ts';
import { softDeleteQuest } from './soft_delete_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getQuestOrThrow', () => {
	it('returns the live quest row mapped into the domain', () => {
		const q = createQuest(db, { title: 'A', objective: 'B', now: 1 });
		const got = getQuestOrThrow(db, q.id);
		strictEqual(got.id, q.id);
		strictEqual(got.title, 'A');
	});

	it('throws when the id does not exist', () => {
		throws(() => getQuestOrThrow(db, 9_999_999), /Quest 9999999 was not found/);
	});

	it('does not return soft-deleted quests (same as missing)', () => {
		const q = createQuest(db, { title: 'X', objective: 'Y', now: 1 });
		softDeleteQuest(db, q.id, 2);
		throws(() => getQuestOrThrow(db, q.id), new RegExp(`Quest ${q.id} was not found`));
	});
});
