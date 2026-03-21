import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { addUnlock } from '../unlocks/add_unlock';
import { createQuest } from './create_quest';
import { listBlockedQuests } from './list_blocked_quests';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listBlockedQuests', () => {
	it('lists quests that have an unresolved blocking edge', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const b = createQuest(db, { title: 'B', objective: 'b', now: 1 });
		addUnlock(db, a.id, b.id, 2);
		const rows = listBlockedQuests(db, {}, 10);
		strictEqual(
			rows.some((q) => q.id === b.id),
			true,
		);
	});
});
