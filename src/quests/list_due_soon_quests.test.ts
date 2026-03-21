import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listDueSoonQuests } from './list_due_soon_quests';

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
