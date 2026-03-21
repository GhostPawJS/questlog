import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listInProgressQuests } from './list_in_progress_quests';
import { startQuest } from './start_quest';

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
