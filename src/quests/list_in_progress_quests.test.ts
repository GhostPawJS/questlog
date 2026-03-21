import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { listInProgressQuests } from './list_in_progress_quests.ts';
import { startQuest } from './start_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listInProgressQuests', () => {
	it('includes started quests that are not yet resolved', () => {
		const q = createQuest(db, { title: 'Run', objective: 'r', now: 1 });
		startQuest(db, q.id, 5);
		const rows = listInProgressQuests(db, {}, 10);
		strictEqual(
			rows.some((r) => r.id === q.id && r.state === 'in_progress'),
			true,
		);
	});
});
