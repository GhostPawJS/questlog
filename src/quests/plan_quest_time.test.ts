import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { planQuestTime } from './plan_quest_time';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('planQuestTime', () => {
	it('updates planning fields and preserves unspecified fields', () => {
		const q = createQuest(db, {
			title: 'P',
			objective: 'o',
			dueAt: 500,
			now: 1,
		});
		const r = planQuestTime(db, q.id, {
			notBeforeAt: 100,
			dueAt: 600,
			now: 2,
		});
		strictEqual(r.notBeforeAt, 100);
		strictEqual(r.dueAt, 600);
	});

	it('rejects negative estimate seconds', () => {
		const q = createQuest(db, { title: 'E', objective: 'e', now: 1 });
		throws(
			() =>
				planQuestTime(db, q.id, {
					estimateSeconds: -1,
					now: 2,
				}),
			/Quest estimate must not be negative/,
		);
	});
});
