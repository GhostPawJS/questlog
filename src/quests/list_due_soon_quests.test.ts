import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { listDueSoonQuests } from './list_due_soon_quests.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listDueSoonQuests', () => {
	it('includes unresolved quests due within [now, now+horizon]', () => {
		const now = 1_000;
		createQuest(db, { title: 'Soon', objective: 's', dueAt: now + 500, now });
		const rows = listDueSoonQuests(db, 600, {}, now);
		strictEqual(
			rows.some((q) => q.title === 'Soon'),
			true,
		);
	});
});
