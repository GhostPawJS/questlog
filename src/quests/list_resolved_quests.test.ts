import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';
import { listResolvedQuests } from './list_resolved_quests.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listResolvedQuests', () => {
	it('lists quests that have any terminal resolution timestamp', () => {
		const q = createQuest(db, { title: 'X', objective: 'y', now: 1 });
		finishQuest(db, q.id, 'ok', 5);
		const rows = listResolvedQuests(db, {}, 10);
		strictEqual(
			rows.some((r) => r.id === q.id),
			true,
		);
	});
});
