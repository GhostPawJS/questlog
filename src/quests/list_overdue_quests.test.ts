import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { listOverdueQuests } from './list_overdue_quests.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listOverdueQuests', () => {
	it('includes unresolved quests whose effective due is strictly before now', () => {
		createQuest(db, { title: 'Late', objective: 'l', dueAt: 100, now: 1 });
		const rows = listOverdueQuests(db, {}, 200);
		strictEqual(rows.length >= 1, true);
		strictEqual(
			rows.some((q) => q.title === 'Late'),
			true,
		);
	});
});
