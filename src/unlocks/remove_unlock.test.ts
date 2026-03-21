import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { listAvailableQuests } from '../quests/list_available_quests';
import { addUnlock } from './add_unlock';
import { removeUnlock } from './remove_unlock';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('removeUnlock', () => {
	it('soft-deletes the unlock edge so the target becomes available again', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const b = createQuest(db, { title: 'B', objective: 'b', now: 1 });
		addUnlock(db, a.id, b.id, 5);
		strictEqual(
			listAvailableQuests(db, {}, 10).some((q) => q.id === b.id),
			false,
		);
		removeUnlock(db, a.id, b.id, 20);
		strictEqual(
			listAvailableQuests(db, {}, 30).some((q) => q.id === b.id),
			true,
		);
		const row = db
			.prepare(
				'SELECT deleted_at FROM quest_unlocks WHERE from_quest_id = ? AND to_quest_id = ? ORDER BY id DESC LIMIT 1',
			)
			.get(a.id, b.id) as { deleted_at: number | null };
		strictEqual(row.deleted_at, 20);
	});
});
