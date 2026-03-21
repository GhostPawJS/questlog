import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { replaceActiveQuestRewards } from './replace_active_quest_rewards.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceActiveQuestRewards', () => {
	it('soft-deletes prior rows and inserts the new set', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		replaceActiveQuestRewards(db, q.id, [{ kind: 'xp', name: 'A', quantity: 1 }], 2);
		replaceActiveQuestRewards(db, q.id, [{ kind: 'xp', name: 'B', quantity: 2 }], 3);
		const active = db
			.prepare(
				'SELECT name FROM quest_rewards WHERE quest_id = ? AND deleted_at IS NULL ORDER BY id',
			)
			.all(q.id) as { name: string }[];
		strictEqual(active.length, 1);
		strictEqual(active[0]?.name, 'B');
		const deletedCount = Number(
			db
				.prepare(
					'SELECT COUNT(*) AS c FROM quest_rewards WHERE quest_id = ? AND deleted_at IS NOT NULL',
				)
				.get(q.id)?.c ?? 0,
		);
		strictEqual(deletedCount >= 1, true);
	});

	it('rejects empty reward fields', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		throws(
			() => replaceActiveQuestRewards(db, q.id, [{ kind: '', name: 'n', quantity: 1 }], 2),
			/Reward kind/,
		);
	});
});
