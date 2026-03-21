import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listDeferredQuests } from './list_deferred_quests';
import { planQuestTime } from './plan_quest_time';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listDeferredQuests', () => {
	it('lists quests with not-before in the future', () => {
		const q = createQuest(db, { title: 'Wait', objective: 'w', now: 1 });
		planQuestTime(db, q.id, { notBeforeAt: 500, now: 2 });
		const rows = listDeferredQuests(db, {}, 100);
		strictEqual(
			rows.some((r) => r.id === q.id),
			true,
		);
	});
});
