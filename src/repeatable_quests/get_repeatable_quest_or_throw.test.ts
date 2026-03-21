import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createRepeatableQuest } from './create_repeatable_quest.ts';
import { getRepeatableQuestOrThrow } from './get_repeatable_quest_or_throw.ts';
import { softDeleteRepeatableQuest } from './soft_delete_repeatable_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getRepeatableQuestOrThrow', () => {
	it('returns the mapped repeatable definition', () => {
		const rq = createRepeatableQuest(db, {
			title: 'Walk',
			objective: 'Move',
			rrule: 'FREQ=DAILY',
			anchorAt: 100,
			now: 1,
		});
		const got = getRepeatableQuestOrThrow(db, rq.id);
		strictEqual(got.id, rq.id);
		strictEqual(got.rrule, 'FREQ=DAILY');
	});

	it('throws when id is unknown', () => {
		throws(() => getRepeatableQuestOrThrow(db, 888_888), /Repeatable quest 888888 was not found/);
	});

	it('does not return soft-deleted definitions', () => {
		const rq = createRepeatableQuest(db, {
			title: 'R',
			objective: 'O',
			rrule: 'FREQ=DAILY',
			anchorAt: 1,
			now: 1,
		});
		softDeleteRepeatableQuest(db, rq.id, 2);
		throws(
			() => getRepeatableQuestOrThrow(db, rq.id),
			new RegExp(`Repeatable quest ${rq.id} was not found`),
		);
	});
});
